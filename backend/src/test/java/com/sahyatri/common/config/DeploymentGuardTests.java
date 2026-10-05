package com.sahyatri.common.config;

import com.sahyatri.common.config.DeploymentGuard.Report;
import com.sahyatri.common.config.DeploymentGuard.Settings;
import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.context.event.ApplicationEnvironmentPreparedEvent;
import org.springframework.boot.bootstrap.DefaultBootstrapContext;
import org.springframework.mock.env.MockEnvironment;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * The startup guard, run the way Spring Boot runs it: on an environment built from the variables a deployment
 * sets, with application.yml's development defaults behind them.
 */
class DeploymentGuardTests {

    /** application.yml's resolved defaults, as properties (what applies when a variable isn't set). */
    private static final Map<String, String> YML_DEFAULTS = Map.ofEntries(
            Map.entry("app.environment", "development"),
            Map.entry("app.auth.jwt-secret", "dev-only-insecure-jwt-secret-change-me-0123456789"),
            Map.entry("app.auth.cookie-secure", "false"),
            Map.entry("app.cors.allowed-origins", "http://localhost:5173"),
            Map.entry("app.public-base-url", "http://localhost:8081"),
            Map.entry("app.frontend-base-url", "http://localhost:5173"),
            Map.entry("app.mail.provider", "log"),
            Map.entry("app.mail.from", "The Empty Valley <no-reply@sahyatri.local>"),
            Map.entry("app.sms.provider", "log"),
            Map.entry("app.storage.type", "local"),
            Map.entry("spring.datasource.password", "sahyatri"),
            Map.entry("app.rate-limit.enabled", "true"));

    /** Today's production task definition (docs/DEPLOY.md §10), with SMS switched off rather than logged. */
    private static final Map<String, String> PRODUCTION_VARS = Map.ofEntries(
            Map.entry("APP_ENV", "production"),
            Map.entry("JWT_SECRET", "a-real-random-secret-of-at-least-32-bytes-0123"),
            Map.entry("AUTH_COOKIE_SECURE", "true"),
            Map.entry("DB_URL", "jdbc:postgresql://db.example.internal:5432/emptyvalley?sslmode=require"),
            Map.entry("DB_USER", "emptyvalley"),
            Map.entry("DB_PASSWORD", "rds-managed-password"),
            Map.entry("PUBLIC_BASE_URL", "https://api.theemptyvalley.com"),
            Map.entry("FRONTEND_BASE_URL", "https://theemptyvalley.com"),
            Map.entry("CORS_ALLOWED_ORIGINS", "https://theemptyvalley.com,https://www.theemptyvalley.com"),
            Map.entry("MAIL_PROVIDER", "ses"),
            Map.entry("MAIL_FROM", "The Empty Valley <no-reply@theemptyvalley.com>"),
            Map.entry("SMS_PROVIDER", "disabled"),
            Map.entry("STORAGE_TYPE", "s3"),
            Map.entry("S3_UPLOADS_BUCKET", "emptyvalley-uploads-bucket"),
            Map.entry("RATE_LIMIT_CLIENT_IP_HEADER", "X-Forwarded-For"));

    /** Variables → environment the way application.yml maps them (`app.x: ${VAR:default}`). */
    private static MockEnvironment environment(Map<String, String> vars) {
        MockEnvironment env = new MockEnvironment();
        YML_DEFAULTS.forEach(env::setProperty);
        vars.forEach((name, value) -> {
            env.setProperty(name, value);
            String property = switch (name) {
                case "APP_ENV" -> "app.environment";
                case "JWT_SECRET" -> "app.auth.jwt-secret";
                case "AUTH_COOKIE_SECURE" -> "app.auth.cookie-secure";
                case "DB_PASSWORD" -> "spring.datasource.password";
                case "PUBLIC_BASE_URL" -> "app.public-base-url";
                case "FRONTEND_BASE_URL" -> "app.frontend-base-url";
                case "CORS_ALLOWED_ORIGINS" -> "app.cors.allowed-origins";
                case "MAIL_PROVIDER" -> "app.mail.provider";
                case "MAIL_FROM" -> "app.mail.from";
                case "SMS_PROVIDER" -> "app.sms.provider";
                case "MSG91_AUTH_KEY" -> "app.sms.msg91-auth-key";
                case "MSG91_OTP_TEMPLATE_ID" -> "app.sms.msg91-otp-template-id";
                case "STORAGE_TYPE" -> "app.storage.type";
                case "S3_UPLOADS_BUCKET" -> "app.storage.s3-bucket";
                case "RATE_LIMIT_ENABLED" -> "app.rate-limit.enabled";
                case "RATE_LIMIT_CLIENT_IP_HEADER" -> "app.rate-limit.client-ip-header";
                case "RAZORPAY_KEY_ID" -> "app.payments.key-id";
                case "RAZORPAY_KEY_SECRET" -> "app.payments.key-secret";
                case "RAZORPAY_WEBHOOK_SECRET" -> "app.payments.webhook-secret";
                default -> null;
            };
            if (property != null) env.setProperty(property, value);
        });
        return env;
    }

    private static Report check(Map<String, String> vars) {
        return DeploymentGuard.check(Settings.from(environment(vars)));
    }

    private static Map<String, String> production(Object... overrides) {
        Map<String, String> vars = new java.util.HashMap<>(PRODUCTION_VARS);
        for (int i = 0; i < overrides.length; i += 2) {
            if (overrides[i + 1] == null) vars.remove((String) overrides[i]);
            else vars.put((String) overrides[i], (String) overrides[i + 1]);
        }
        return vars;
    }

    private static void runGuard(MockEnvironment env) {
        new DeploymentGuard().onApplicationEvent(new ApplicationEnvironmentPreparedEvent(
                new DefaultBootstrapContext(), new SpringApplication(), new String[0], env));
    }

    // 1. Development with valid configuration
    @Test
    void developmentStartsOnTheDefaults() {
        Report report = check(Map.of());
        assertThat(report.problems()).isEmpty();
        assertThat(report.warnings()).isEmpty();
        assertThatCode(() -> runGuard(environment(Map.of()))).doesNotThrowAnyException();
    }

    // 2. Development with optional providers disabled
    @Test
    void developmentWithOptionalProvidersOffStarts() {
        Report report = check(Map.of("SMS_PROVIDER", "disabled", "RATE_LIMIT_ENABLED", "false"));
        assertThat(report.problems()).isEmpty();
    }

    @Test
    void todaysProductionConfigurationPassesWithPaymentsOff() {
        Report report = check(production());
        assertThat(report.problems()).isEmpty();
        assertThat(report.warnings()).containsExactly("Razorpay keys are not set: payments are switched off");
    }

    // 3. Production with missing email configuration
    @Test
    void productionWithoutMailSettingsFailsAsMissing() {
        assertThat(check(production("MAIL_PROVIDER", null, "MAIL_FROM", null)).problems())
                .containsExactly("Missing: MAIL_PROVIDER is not set", "Missing: MAIL_FROM is not set");
    }

    // 4. Production with missing SMS configuration
    @Test
    void productionWithoutSmsSettingsFailsAsMissing() {
        assertThat(check(production("SMS_PROVIDER", null)).problems())
                .containsExactly("Missing: SMS_PROVIDER is not set");
        assertThat(check(production("SMS_PROVIDER", "msg91")).problems())
                .containsExactly("Missing: SMS_PROVIDER=msg91 needs MSG91_AUTH_KEY and MSG91_OTP_TEMPLATE_ID");
        assertThat(check(production("SMS_PROVIDER", "msg91", "MSG91_AUTH_KEY", "k", "MSG91_OTP_TEMPLATE_ID", "t"))
                .problems()).isEmpty();
    }

    // 5. Production with missing JWT secret
    @Test
    void productionWithoutJwtSecretFails() {
        assertThat(check(production("JWT_SECRET", null)).problems())
                .containsExactly("Missing: JWT_SECRET is not set");
        assertThat(check(production("JWT_SECRET", "change-me-to-a-random-string-of-at-least-32-bytes")).problems())
                .containsExactly("Invalid: JWT_SECRET is a placeholder or shorter than 32 bytes (openssl rand -base64 48)");
    }

    // 6. Production with missing database configuration
    @Test
    void productionWithoutDatabaseSettingsFails() {
        assertThat(check(production("DB_URL", null, "DB_USER", null, "DB_PASSWORD", null)).problems())
                .containsExactly("Missing: DB_URL is not set", "Missing: DB_USER is not set",
                        "Missing: DB_PASSWORD is not set");
        assertThat(check(production("DB_PASSWORD", "sahyatri")).problems())
                .containsExactly("Invalid: DB_PASSWORD is the docker-compose default");
    }

    // 7. Production with invalid provider configuration
    @Test
    void productionRefusesLogProvidersAndLocalStorage() {
        assertThat(check(production("MAIL_PROVIDER", "log", "SMS_PROVIDER", "log", "STORAGE_TYPE", "local"))
                .problems()).containsExactly(
                "Invalid: MAIL_PROVIDER must be ses (log only prints emails, including sign-in links)",
                "Invalid: SMS_PROVIDER must be msg91, or disabled until SMS can be delivered (log prints OTP codes)",
                "Invalid: STORAGE_TYPE must be s3 (a container's local disk is lost on every deploy)");
    }

    @Test
    void everyDevelopmentDefaultIsRefusedWhenDeployed() {
        List<String> problems = check(Map.of("APP_ENV", "staging")).problems();
        assertThat(problems).hasSize(DeploymentGuard.REQUIRED_WHEN_DEPLOYED.size())
                .allMatch(p -> p.startsWith("Missing: "));
    }

    @Test
    void wildcardLocalAndPlainHttpUrlsAreRefused() {
        assertThat(check(production("CORS_ALLOWED_ORIGINS", "https://*.theemptyvalley.com,https://127.0.0.1:5173",
                "PUBLIC_BASE_URL", "http://api.theemptyvalley.com", "AUTH_COOKIE_SECURE", "false")).problems())
                .hasSize(4);
    }

    @Test
    void verboseLoggingIsRefusedWhenDeployed() {
        MockEnvironment env = environment(production());
        env.setProperty("logging.level.org.hibernate.SQL", "debug");
        assertThat(DeploymentGuard.check(Settings.from(env)).problems()).containsExactly(
                "Invalid: logging.level.org.hibernate.SQL is DEBUG/TRACE, which can log request data");
    }

    @Test
    void productionTakesLiveKeysWithAWebhookSecret() {
        assertThat(check(production("RAZORPAY_KEY_ID", "rzp_live_abc", "RAZORPAY_KEY_SECRET", "s",
                "RAZORPAY_WEBHOOK_SECRET", "w")).problems()).isEmpty();
        assertThat(check(production("RAZORPAY_KEY_ID", "rzp_test_abc", "RAZORPAY_KEY_SECRET", "s",
                "RAZORPAY_WEBHOOK_SECRET", "w")).problems()).singleElement().asString()
                .startsWith("Invalid: production takes live Razorpay keys");
        assertThat(check(production("RAZORPAY_KEY_ID", "rzp_live_abc", "RAZORPAY_KEY_SECRET", "s")).problems())
                .singleElement().asString().startsWith("Missing: RAZORPAY_WEBHOOK_SECRET");
    }

    @Test
    void liveKeysNeverRunOutsideProduction() {
        assertThat(check(production("APP_ENV", "staging", "RAZORPAY_KEY_ID", "rzp_test_abc",
                "RAZORPAY_KEY_SECRET", "s", "RAZORPAY_WEBHOOK_SECRET", "w")).problems()).isEmpty();
        assertThat(check(production("APP_ENV", "staging", "RAZORPAY_KEY_ID", "rzp_live_abc",
                "RAZORPAY_KEY_SECRET", "s", "RAZORPAY_WEBHOOK_SECRET", "w")).problems())
                .singleElement().asString().startsWith("Invalid: live Razorpay keys");
        assertThat(check(Map.of("RAZORPAY_KEY_ID", "rzp_live_abc", "RAZORPAY_KEY_SECRET", "s")).problems())
                .singleElement().asString().startsWith("Invalid: live Razorpay keys");
        // A laptop may use test keys without registering a webhook.
        assertThat(check(Map.of("RAZORPAY_KEY_ID", "rzp_test_abc", "RAZORPAY_KEY_SECRET", "s")).problems()).isEmpty();
    }

    @Test
    void halfConfiguredOrUnknownKeysAreRefusedEverywhere() {
        assertThat(check(Map.of("RAZORPAY_KEY_ID", "rzp_test_abc")).problems())
                .containsExactly("Missing: set both RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, or neither");
        assertThat(check(Map.of("RAZORPAY_KEY_ID", "key_abc", "RAZORPAY_KEY_SECRET", "s")).problems())
                .containsExactly("Invalid: RAZORPAY_KEY_ID must start with rzp_test_ or rzp_live_");
    }

    @Test
    void developmentThatLooksDeployedIsFlagged() {
        Report report = check(production("APP_ENV", "development"));
        assertThat(report.problems()).isEmpty();
        assertThat(report.warnings()).singleElement().asString().startsWith("APP_ENV is development");
    }

    @Test
    void failureNamesTheVariablesButNeverTheirValues() {
        MockEnvironment env = environment(production("JWT_SECRET", "short-secret-value", "DB_PASSWORD", "sahyatri",
                "RAZORPAY_KEY_ID", "rzp_test_publicid", "RAZORPAY_KEY_SECRET", "very-secret-key-value",
                "RAZORPAY_WEBHOOK_SECRET", "very-secret-webhook-value"));
        assertThatThrownBy(() -> runGuard(env))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("APP_ENV=production can't start")
                .hasMessageContaining("JWT_SECRET")
                .hasMessageContaining("DB_PASSWORD")
                .hasMessageNotContaining("short-secret-value")
                .hasMessageNotContaining("very-secret-key-value")
                .hasMessageNotContaining("very-secret-webhook-value");
    }

    @Test
    void unknownEnvironmentNameFails() {
        assertThatThrownBy(() -> runGuard(environment(Map.of("APP_ENV", "prod"))))
                .hasMessage("APP_ENV must be development, staging or production");
    }

    @Test
    void paymentModeFollowsTheKeyPrefix() {
        assertThat(DeploymentGuard.paymentMode(null)).isEqualTo("off");
        assertThat(DeploymentGuard.paymentMode("rzp_test_x")).isEqualTo("test");
        assertThat(DeploymentGuard.paymentMode("rzp_live_x")).isEqualTo("live");
        assertThat(DeploymentGuard.paymentMode("x")).isEqualTo("unknown");
    }
}
