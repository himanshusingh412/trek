package com.sahyatri.common.exception;

import com.sahyatri.common.web.RequestIdFilter;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.CannotCreateTransactionException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.sql.SQLException;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** The error body for failures that never reach a service's ApiException. No Spring context or database needed. */
class GlobalExceptionHandlerTests {

    private final MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new FailingController())
            .setControllerAdvice(new GlobalExceptionHandler())
            .addFilters(new RequestIdFilter())
            .build();

    @RestController
    static class FailingController {

        @PostMapping("/t/echo")
        Map<String, Object> echo(@RequestBody Map<String, Object> body) {
            return body;
        }

        @GetMapping("/t/param")
        int param(@RequestParam int days) {
            return days;
        }

        @GetMapping("/t/integrity")
        void integrity() {
            throw new DataIntegrityViolationException("duplicate key value violates unique constraint \"users_email_key\"");
        }

        @GetMapping("/t/lock")
        void lock() {
            throw new PessimisticLockingFailureException("could not obtain lock");
        }

        @GetMapping("/t/db-down")
        void dbDown() {
            throw new CannotCreateTransactionException("Could not open JPA EntityManager for transaction");
        }

        @GetMapping("/t/connection-refused")
        void connectionRefused() {
            throw new IllegalStateException("wrapped", new SQLException("Connection refused", "08001"));
        }

        @GetMapping("/t/bug")
        void bug() {
            throw new IllegalStateException("secret internal detail: SELECT * FROM users");
        }
    }

    @Test
    void wrongMethodIs405WithAllowHeader() throws Exception {
        mockMvc.perform(get("/t/echo"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(header().string("Allow", "POST"))
                .andExpect(jsonPath("$.code").value("METHOD_NOT_ALLOWED"));
    }

    @Test
    void wrongContentTypeIs415() throws Exception {
        mockMvc.perform(post("/t/echo").contentType(MediaType.TEXT_PLAIN).content("hi"))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.code").value("UNSUPPORTED_MEDIA_TYPE"));
    }

    @Test
    void missingQueryParameterIsAFieldError() throws Exception {
        mockMvc.perform(get("/t/param"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.details.fields.days").value("is required"));
    }

    @Test
    void integrityViolationIsAConflictWithoutSql() throws Exception {
        MvcResult result = mockMvc.perform(get("/t/integrity"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONFLICT"))
                .andReturn();
        assertThat(result.getResponse().getContentAsString()).doesNotContain("users_email_key");
    }

    @Test
    void lockFailureIsARetryableConflict() throws Exception {
        mockMvc.perform(get("/t/lock"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONCURRENT_UPDATE"));
    }

    @Test
    void databaseDownIs503WithRetryAfter() throws Exception {
        mockMvc.perform(get("/t/db-down"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(header().string("Retry-After", "30"))
                .andExpect(jsonPath("$.code").value("SERVICE_UNAVAILABLE"));
        mockMvc.perform(get("/t/connection-refused"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("SERVICE_UNAVAILABLE"));
    }

    @Test
    void unexpectedErrorHidesInternalsAndCarriesTheRequestId() throws Exception {
        MvcResult result = mockMvc.perform(get("/t/bug").header(RequestIdFilter.HEADER, "support-ref-12345"))
                .andExpect(status().isInternalServerError())
                .andExpect(header().string(RequestIdFilter.HEADER, "support-ref-12345"))
                .andExpect(jsonPath("$.code").value("INTERNAL_ERROR"))
                .andExpect(jsonPath("$.message").value("Something went wrong"))
                .andExpect(jsonPath("$.details.request_id").value("support-ref-12345"))
                .andReturn();
        assertThat(result.getResponse().getContentAsString()).doesNotContain("SELECT", "secret", "IllegalState");
    }
}
