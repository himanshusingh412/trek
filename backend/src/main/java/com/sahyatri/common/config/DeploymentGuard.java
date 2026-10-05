package com.sahyatri.common.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationEnvironmentPreparedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.Ordered;
import org.springframework.core.env.Environment;

import java.net.URI;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Refuses to start a deployed instance (`APP_ENV` staging or production) on missing or development
 * configuration, and keeps Razorpay test and live keys in their own environments. Runs as soon as the
 * configuration is read — before the database pool, Flyway or the web server start — and lists every problem at
 * once, split into missing and invalid settings. Values are never printed, only variable names. Development only
 * gets the Razorpay checks and warnings. Registered in META-INF/spring.factories; variables: docs/ENVIRONMENT.md.
 */
public class DeploymentGuard implements ApplicationListener<ApplicationEnvironmentPreparedEvent>, Ordered {

    private static final Logger log = LoggerFactory.getLogger(DeploymentGuard.class);

    /** docker-compose.yml's default database password. */
    static final String COMPOSE_DB_PASSWORD = "sahyatri";

    /** Must be set explicitly on a deployed instance: their application.yml defaults are for development. */
    static final List<String> REQUIRED_WHEN_DEPLOYED = List.of(
            "JWT_SECRET", "AUTH_COOKIE_SECURE", "DB_URL", "DB_USER", "DB_PASSWORD", "PUBLIC_BASE_URL",
            "FRONTEND_BASE_URL", "CORS_ALLOWED_ORIGINS", "MAIL_PROVIDER", "MAIL_FROM", "SMS_PROVIDER", "STORAGE_TYPE",
            "RATE_LIMIT_CLIENT_IP_HEADER");

    /** Loggers that would write request data or SQL if turned up to DEBUG/TRACE on a deployed instance. */
    static final List<String> QUIET_LOGGERS = List.of("root", "com.sahyatri", "org.springframework.web",
            "org.springframework.security", "org.hibernate.SQL", "org.hibernate.orm.jdbc.bind");

    @Override
    public void onApplicationEvent(ApplicationEnvironmentPreparedEvent event) {
        Settings settings = Settings.from(event.getEnvironment());
        Report report = check(settings);
        report.warnings().forEach(w -> log.warn("Configuration: {}", w));
        if (!report.problems().isEmpty()) {
            throw new IllegalStateException("APP_ENV=" + name(settings.environment())
                    + " can't start with this configuration (values are not shown):\n - "
                    + String.join("\n - ", report.problems()));
        }
        log.info("Environment {}: payments {}, mail {}, sms {}, storage {}", name(settings.environment()),
                paymentMode(settings.razorpayKeyId()), settings.mailProvider(), settings.smsProvider(),
                settings.storageType());
    }

    @Override
    public int getOrder() {
        // After Spring Boot's own listeners, so logging is set up.
        return Ordered.LOWEST_PRECEDENCE;
    }

    /**
     * Everything the guard looks at, so {@link #check} can be tested without Spring. Values are the resolved
     * settings (application.yml defaults applied); {@code unset} names the environment variables not given at all.
     */
    record Settings(AppEnvironment environment, Set<String> unset, boolean cookieSecure, String jwtSecret,
                    List<String> corsOrigins, String publicBaseUrl, String frontendBaseUrl, String mailProvider,
                    String mailFrom, String smsProvider, boolean msg91Configured, String storageType,
                    String s3Bucket, String dbPassword, boolean rateLimitEnabled, String rateLimitClientIpHeader,
                    String razorpayKeyId, String razorpayKeySecret, String razorpayWebhookSecret,
                    List<String> verboseLoggers) {

        static Settings from(Environment env) {
            Set<String> unset = new LinkedHashSet<>();
            for (String variable : List.of("JWT_SECRET", "AUTH_COOKIE_SECURE", "DB_URL", "DB_USER", "DB_PASSWORD",
                    "PUBLIC_BASE_URL", "FRONTEND_BASE_URL", "CORS_ALLOWED_ORIGINS", "MAIL_PROVIDER", "MAIL_FROM",
                    "SMS_PROVIDER", "STORAGE_TYPE", "S3_UPLOADS_BUCKET", "RATE_LIMIT_CLIENT_IP_HEADER",
                    "MSG91_AUTH_KEY", "MSG91_OTP_TEMPLATE_ID")) {
                if (isBlank(env.getProperty(variable))) unset.add(variable);
            }
            List<String> verbose = QUIET_LOGGERS.stream()
                    .filter(l -> {
                        String level = env.getProperty("logging.level." + l);
                        return level != null && Set.of("DEBUG", "TRACE", "ALL").contains(level.trim().toUpperCase(Locale.ROOT));
                    })
                    .toList();
            String environment = env.getProperty("app.environment", "development").trim().toUpperCase(Locale.ROOT);
            AppEnvironment parsed;
            try {
                parsed = AppEnvironment.valueOf(environment);
            } catch (IllegalArgumentException e) {
                throw new IllegalStateException("APP_ENV must be development, staging or production");
            }
            return new Settings(parsed, unset,
                    Boolean.parseBoolean(env.getProperty("app.auth.cookie-secure", "false").trim()),
                    env.getProperty("app.auth.jwt-secret", ""),
                    Arrays.stream(env.getProperty("app.cors.allowed-origins", "").split(","))
                            .map(String::trim).filter(o -> !o.isEmpty()).toList(),
                    env.getProperty("app.public-base-url"), env.getProperty("app.frontend-base-url"),
                    env.getProperty("app.mail.provider"), env.getProperty("app.mail.from"),
                    env.getProperty("app.sms.provider"),
                    !isBlank(env.getProperty("app.sms.msg91-auth-key"))
                            && !isBlank(env.getProperty("app.sms.msg91-otp-template-id")),
                    env.getProperty("app.storage.type"), env.getProperty("app.storage.s3-bucket"),
                    env.getProperty("spring.datasource.password"),
                    Boolean.parseBoolean(env.getProperty("app.rate-limit.enabled", "true").trim()),
                    env.getProperty("app.rate-limit.client-ip-header"),
                    env.getProperty("app.payments.key-id"), env.getProperty("app.payments.key-secret"),
                    env.getProperty("app.payments.webhook-secret"), verbose);
        }
    }

    /** {@code problems} stop the start; {@code warnings} are logged. */
    record Report(List<String> problems, List<String> warnings) {
    }

    static Report check(Settings s) {
        List<String> problems = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        checkPayments(s, problems, warnings);
        if (!s.environment().isDeployed()) {
            if (s.cookieSecure() || s.corsOrigins().stream().anyMatch(o -> isHttps(o) && !isLocal(o))) {
                warnings.add("APP_ENV is development, but secure cookies or a public HTTPS origin suggest a deployed "
                        + "instance. Set APP_ENV=staging or APP_ENV=production there.");
            }
            return new Report(problems, warnings);
        }

        for (String variable : REQUIRED_WHEN_DEPLOYED) {
            if (s.unset().contains(variable)) {
                problems.add("Missing: " + variable + " is not set");
            }
        }
        if (!s.unset().contains("AUTH_COOKIE_SECURE") && !s.cookieSecure()) {
            problems.add("Invalid: AUTH_COOKIE_SECURE must be true (deployed sites run on HTTPS)");
        }
        if (!s.unset().contains("JWT_SECRET") && (AuthProperties.isPlaceholderSecret(s.jwtSecret())
                || s.jwtSecret().getBytes(java.nio.charset.StandardCharsets.UTF_8).length < 32)) {
            problems.add("Invalid: JWT_SECRET is a placeholder or shorter than 32 bytes (openssl rand -base64 48)");
        }
        if (!s.unset().contains("CORS_ALLOWED_ORIGINS")) {
            for (String origin : s.corsOrigins()) {
                if (origin.contains("*") || !isHttps(origin) || isLocal(origin)) {
                    problems.add("Invalid: CORS_ALLOWED_ORIGINS entry '" + origin
                            + "' must be an exact https:// origin, not local");
                }
            }
        }
        if (!s.unset().contains("PUBLIC_BASE_URL")) requirePublicHttps("PUBLIC_BASE_URL", s.publicBaseUrl(), problems);
        if (!s.unset().contains("FRONTEND_BASE_URL")) requirePublicHttps("FRONTEND_BASE_URL", s.frontendBaseUrl(), problems);
        if (!s.unset().contains("MAIL_PROVIDER") && !"ses".equals(s.mailProvider())) {
            problems.add("Invalid: MAIL_PROVIDER must be ses (log only prints emails, including sign-in links)");
        }
        if (!s.unset().contains("MAIL_FROM") && (s.mailFrom() == null
                || s.mailFrom().toLowerCase(Locale.ROOT).contains(".local"))) {
            problems.add("Invalid: MAIL_FROM must be an address on the SES-verified domain");
        }
        if (!s.unset().contains("SMS_PROVIDER")) {
            if ("msg91".equals(s.smsProvider())) {
                if (!s.msg91Configured()) {
                    problems.add("Missing: SMS_PROVIDER=msg91 needs MSG91_AUTH_KEY and MSG91_OTP_TEMPLATE_ID");
                }
            } else if (!"disabled".equals(s.smsProvider())) {
                problems.add("Invalid: SMS_PROVIDER must be msg91, or disabled until SMS can be delivered "
                        + "(log prints OTP codes)");
            }
        }
        if (!s.unset().contains("STORAGE_TYPE")) {
            if (!"s3".equals(s.storageType())) {
                problems.add("Invalid: STORAGE_TYPE must be s3 (a container's local disk is lost on every deploy)");
            } else if (s.unset().contains("S3_UPLOADS_BUCKET")) {
                problems.add("Missing: S3_UPLOADS_BUCKET is not set (STORAGE_TYPE=s3)");
            }
        }
        if (!s.unset().contains("DB_PASSWORD") && COMPOSE_DB_PASSWORD.equals(s.dbPassword())) {
            problems.add("Invalid: DB_PASSWORD is the docker-compose default");
        }
        if (!s.rateLimitEnabled()) {
            problems.add("Invalid: RATE_LIMIT_ENABLED must be true");
        }
        for (String logger : s.verboseLoggers()) {
            problems.add("Invalid: logging.level." + logger + " is DEBUG/TRACE, which can log request data");
        }
        return new Report(problems, warnings);
    }

    /** Test keys never take real money and live keys never run outside production. */
    private static void checkPayments(Settings s, List<String> problems, List<String> warnings) {
        boolean hasId = !isBlank(s.razorpayKeyId());
        if (hasId != !isBlank(s.razorpayKeySecret())) {
            problems.add("Missing: set both RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, or neither");
            return;
        }
        if (!hasId) {
            if (s.environment() == AppEnvironment.PRODUCTION) {
                warnings.add("Razorpay keys are not set: payments are switched off");
            }
            return;
        }
        String mode = paymentMode(s.razorpayKeyId());
        if ("unknown".equals(mode)) {
            problems.add("Invalid: RAZORPAY_KEY_ID must start with rzp_test_ or rzp_live_");
        } else if (s.environment() == AppEnvironment.PRODUCTION && "test".equals(mode)) {
            problems.add("Invalid: production takes live Razorpay keys (rzp_live_…); test keys belong in staging "
                    + "or development");
        } else if (s.environment() != AppEnvironment.PRODUCTION && "live".equals(mode)) {
            problems.add("Invalid: live Razorpay keys (rzp_live_…) only run with APP_ENV=production; use test keys");
        }
        if (s.environment().isDeployed() && isBlank(s.razorpayWebhookSecret())) {
            problems.add("Missing: RAZORPAY_WEBHOOK_SECRET must be set with the keys (the webhook confirms "
                    + "payments the browser never reports)");
        }
    }

    static String paymentMode(String keyId) {
        if (isBlank(keyId)) return "off";
        if (keyId.startsWith("rzp_test_")) return "test";
        if (keyId.startsWith("rzp_live_")) return "live";
        return "unknown";
    }

    private static void requirePublicHttps(String variable, String url, List<String> problems) {
        if (!isHttps(url) || isLocal(url)) {
            problems.add("Invalid: " + variable + " must be a public https:// URL");
        }
    }

    private static boolean isHttps(String url) {
        return url != null && url.trim().toLowerCase(Locale.ROOT).startsWith("https://");
    }

    private static boolean isLocal(String url) {
        String host;
        try {
            host = URI.create(url.trim()).getHost();
        } catch (IllegalArgumentException e) {
            return true;
        }
        if (host == null) return true;
        host = host.toLowerCase(Locale.ROOT);
        return host.equals("localhost") || host.endsWith(".localhost") || host.startsWith("127.")
                || host.equals("0.0.0.0") || host.equals("[::1]") || host.equals("::1");
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static String name(AppEnvironment environment) {
        return environment.name().toLowerCase(Locale.ROOT);
    }
}
