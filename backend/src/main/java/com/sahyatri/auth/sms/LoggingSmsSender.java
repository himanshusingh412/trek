package com.sahyatri.auth.sms;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/** Dev only (`SMS_PROVIDER=log`): prints OTP codes. Refuses to exist on a deployed instance (APP_ENV). */
@Component
@ConditionalOnProperty(name = "app.sms.provider", havingValue = "log", matchIfMissing = true)
public class LoggingSmsSender implements SmsSender {

    private static final Logger log = LoggerFactory.getLogger(LoggingSmsSender.class);

    public LoggingSmsSender(@Value("${app.environment:development}") String environment) {
        if (!"development".equalsIgnoreCase(environment.trim())) {
            throw new IllegalStateException("SMS_PROVIDER=log prints OTP codes and only runs with APP_ENV=development");
        }
    }

    @Override
    public void sendOtp(String phone, String code) {
        log.warn("DEV SMS — OTP for {} is {}", phone, code);
    }
}
