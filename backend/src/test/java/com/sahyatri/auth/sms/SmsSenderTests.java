package com.sahyatri.auth.sms;

import com.sahyatri.common.config.SmsProperties;
import com.sahyatri.common.exception.ApiException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SmsSenderTests {

    @Test
    void loggingSenderOnlyExistsInDevelopment() {
        assertThatCode(() -> new LoggingSmsSender("development")).doesNotThrowAnyException();
        assertThatThrownBy(() -> new LoggingSmsSender("production")).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> new LoggingSmsSender("staging")).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void disabledSenderRefusesWithoutRevealingTheCode() {
        assertThatThrownBy(() -> new DisabledSmsSender().sendOtp("+919876543210", "123456"))
                .isInstanceOfSatisfying(ApiException.class, e -> {
                    assertThat(e.getStatus().value()).isEqualTo(503);
                    assertThat(e.getCode()).isEqualTo("SMS_UNAVAILABLE");
                    assertThat(e.getMessage()).doesNotContain("123456");
                    assertThat(e.getDetails()).isEmpty();
                });
    }

    @Test
    void msg91NeedsItsKeyAndTemplate() {
        assertThatThrownBy(() -> new Msg91SmsSender(new SmsProperties("msg91", "", "")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("MSG91_AUTH_KEY");
    }
}
