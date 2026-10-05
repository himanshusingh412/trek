package com.sahyatri.auth.sms;

/** Delivers OTP codes (`app.sms.provider`): {@code log} in dev, {@code msg91} in prod, {@code disabled} until SMS works. */
public interface SmsSender {

    void sendOtp(String phone, String code);
}
