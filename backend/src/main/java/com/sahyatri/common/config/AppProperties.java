package com.sahyatri.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Environment, deployment URLs, file storage and mail settings (`app.*`). Auth and CORS have their own records.
 *
 * @param environment `APP_ENV`: development (default), staging or production
 */
@ConfigurationProperties("app")
public record AppProperties(
        AppEnvironment environment,
        String publicBaseUrl,
        String frontendBaseUrl,
        Storage storage,
        Mail mail) {

    public AppProperties {
        environment = environment == null ? AppEnvironment.DEVELOPMENT : environment;
    }

    /**
     * @param type     {@code local} (dev) or {@code s3}
     * @param localDir root directory for uploaded files when local
     * @param s3Bucket bucket for uploaded files when s3 (region from AWS_REGION)
     */
    public record Storage(String type, String localDir, String s3Bucket) {
    }

    /**
     * @param provider {@code log} (dev: prints links to the log) or {@code ses}
     * @param from     sender, e.g. "The Empty Valley &lt;no-reply@example.com&gt;" (must be SES-verified when ses)
     */
    public record Mail(String provider, String from) {
    }
}
