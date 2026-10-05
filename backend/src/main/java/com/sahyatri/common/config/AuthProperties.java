package com.sahyatri.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.nio.charset.StandardCharsets;
import java.time.Duration;

@ConfigurationProperties("app.auth")
public record AuthProperties(
        String jwtSecret,
        Duration accessTtl,
        Duration refreshTtl,
        Duration refreshReuseGrace,
        boolean cookieSecure,
        String googleClientId) {

    public AuthProperties {
        if (jwtSecret == null || jwtSecret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("app.auth.jwt-secret (JWT_SECRET) must be at least 32 bytes");
        }
        // Secure cookies mean a real HTTPS deployment: refuse the public dev default and the .env.example placeholder.
        if (cookieSecure && isPlaceholderSecret(jwtSecret)) {
            throw new IllegalStateException("JWT_SECRET is still the dev placeholder; set a random secret");
        }
    }

    /** The application.yml dev default or the .env.example placeholder. */
    public static boolean isPlaceholderSecret(String jwtSecret) {
        return jwtSecret.startsWith("dev-only-") || jwtSecret.startsWith("change-me");
    }
}
