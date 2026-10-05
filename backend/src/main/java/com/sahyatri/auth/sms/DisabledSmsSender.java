package com.sahyatri.auth.sms;

import com.sahyatri.common.exception.ApiException;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * `SMS_PROVIDER=disabled`: for a deployed site that can't deliver SMS yet (TRAI DLT pending). Every OTP request
 * fails with 503 SMS_UNAVAILABLE, which rolls back the code it would have stored, so no code exists anywhere —
 * unlike {@code log}, which writes codes to the server log.
 */
@Component
@ConditionalOnProperty(name = "app.sms.provider", havingValue = "disabled")
public class DisabledSmsSender implements SmsSender {

    @Override
    public void sendOtp(String phone, String code) {
        throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "SMS_UNAVAILABLE",
                "Sign-in codes by SMS aren't available yet. Please use email or Google.");
    }
}
