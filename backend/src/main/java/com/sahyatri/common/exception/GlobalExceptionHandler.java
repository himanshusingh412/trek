package com.sahyatri.common.exception;

import com.sahyatri.common.web.RequestIdFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.ConcurrencyFailureException;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.QueryTimeoutException;
import org.springframework.dao.TransientDataAccessResourceException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.transaction.CannotCreateTransactionException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.exc.MismatchedInputException;

import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Turns every exception into the {code, message, details} body. Messages are fixed strings: exception text, SQL
 * and class names stay in the server log. A 500's details carry the request id that leads to its log line.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private static final long DATABASE_RETRY_AFTER_SECONDS = 30;

    @ExceptionHandler(ApiException.class)
    ResponseEntity<ApiError> handleApi(ApiException ex) {
        return ResponseEntity.status(ex.getStatus())
                .body(new ApiError(ex.getCode(), ex.getMessage(), ex.getDetails()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, Object> fields = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(e -> fields.putIfAbsent(toSnakeCase(e.getField()), e.getDefaultMessage()));
        return ResponseEntity.badRequest()
                .body(new ApiError("VALIDATION_FAILED", "Request validation failed", Map.of("fields", fields)));
    }

    /** Field names in details.fields must match the snake_case JSON the client sent. */
    private static String toSnakeCase(String field) {
        return field.replaceAll("([a-z0-9])([A-Z])", "$1_$2").toLowerCase();
    }

    /** A value of the wrong type (unknown enum, bad date) is a field error; anything else is a malformed body. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ApiError> handleUnreadable(HttpMessageNotReadableException ex) {
        if (ex.getCause() instanceof MismatchedInputException mismatch && !mismatch.getPath().isEmpty()) {
            String field = mismatch.getPath().stream()
                    .map(JacksonException.Reference::getPropertyName)
                    .filter(Objects::nonNull)
                    .collect(Collectors.joining("."));
            if (!field.isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiError("VALIDATION_FAILED", "Request validation failed",
                        Map.of("fields", Map.of(field, "has an invalid value"))));
            }
        }
        return ResponseEntity.badRequest().body(ApiError.of("MALFORMED_REQUEST", "Request body is invalid"));
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    ResponseEntity<ApiError> handleMissingPart(MissingServletRequestPartException ex) {
        return ResponseEntity.badRequest().body(new ApiError("VALIDATION_FAILED", "Request validation failed",
                Map.of("fields", Map.of(ex.getRequestPartName(), "is required"))));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    ResponseEntity<ApiError> handleMissingParameter(MissingServletRequestParameterException ex) {
        return ResponseEntity.badRequest().body(new ApiError("VALIDATION_FAILED", "Request validation failed",
                Map.of("fields", Map.of(ex.getParameterName(), "is required"))));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ResponseEntity<ApiError> handleTooLarge(MaxUploadSizeExceededException ex) {
        return ResponseEntity.status(HttpStatus.CONTENT_TOO_LARGE)
                .body(ApiError.of("FILE_TOO_LARGE", "File is too large"));
    }

    @ExceptionHandler(MultipartException.class)
    ResponseEntity<ApiError> handleMultipart(MultipartException ex) {
        return ResponseEntity.badRequest().body(ApiError.of("MALFORMED_REQUEST", "Expected a multipart upload"));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ResponseEntity<ApiError> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        if (ex.getParameter().hasParameterAnnotation(PathVariable.class)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiError.of("NOT_FOUND", "Resource not found"));
        }
        return ResponseEntity.badRequest().body(new ApiError("VALIDATION_FAILED", "Request validation failed",
                Map.of("fields", Map.of(ex.getName(), "has an invalid value"))));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<ApiError> handleNoResource(NoResourceFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiError.of("NOT_FOUND", "Resource not found"));
    }

    /** A unique or check constraint the service didn't anticipate, usually two requests racing. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ApiError> handleIntegrity(DataIntegrityViolationException ex) {
        log.warn("Data integrity violation (SQL state {}): {}", sqlState(ex), ex.getClass().getSimpleName());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiError.of("CONFLICT", "This conflicts with a change made just now. Refresh and try again."));
    }

    /** Lock timeouts, deadlocks and optimistic-lock failures: safe for the client to retry. */
    @ExceptionHandler(ConcurrencyFailureException.class)
    ResponseEntity<ApiError> handleConcurrency(ConcurrencyFailureException ex) {
        log.warn("Concurrent update: {}", ex.getClass().getSimpleName());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiError.of("CONCURRENT_UPDATE", "Someone else changed this at the same moment. Please try again."));
    }

    @ExceptionHandler({CannotCreateTransactionException.class, DataAccessResourceFailureException.class,
            TransientDataAccessResourceException.class, QueryTimeoutException.class})
    ResponseEntity<ApiError> handleDatabaseUnavailable(Exception ex) {
        log.error("Database unavailable", ex);
        return databaseUnavailable();
    }

    /** The client went away mid-response; there is no one to answer. */
    @ExceptionHandler(AsyncRequestNotUsableException.class)
    void handleClientGone(AsyncRequestNotUsableException ex) {
        log.debug("Client disconnected: {}", ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiError> handleUnexpected(Exception ex) {
        // Spring MVC's own 4xx errors (wrong method, media type, missing header, …) are the client's mistake.
        if (ex instanceof ErrorResponse errorResponse && errorResponse.getStatusCode().is4xxClientError()) {
            return clientError(errorResponse);
        }
        if (isConnectionFailure(ex)) {
            log.error("Database unavailable", ex);
            return databaseUnavailable();
        }
        log.error("Unhandled exception", ex);
        String requestId = RequestIdFilter.current();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiError("INTERNAL_ERROR", "Something went wrong",
                        requestId == null ? Map.of() : Map.of("request_id", requestId)));
    }

    private static ResponseEntity<ApiError> clientError(ErrorResponse errorResponse) {
        HttpStatus status = HttpStatus.valueOf(errorResponse.getStatusCode().value());
        HttpHeaders headers = errorResponse.getHeaders(); // e.g. Allow on a 405
        if (status == HttpStatus.NOT_ACCEPTABLE) {
            // The client accepts no JSON, so the usual body can't be written.
            return ResponseEntity.status(status).headers(headers).build();
        }
        ApiError body = switch (status) {
            case METHOD_NOT_ALLOWED -> ApiError.of("METHOD_NOT_ALLOWED", "This method isn't supported here");
            case UNSUPPORTED_MEDIA_TYPE -> ApiError.of("UNSUPPORTED_MEDIA_TYPE", "This content type isn't supported here");
            case NOT_FOUND -> ApiError.of("NOT_FOUND", "Resource not found");
            default -> ApiError.of("MALFORMED_REQUEST", "Request is invalid");
        };
        return ResponseEntity.status(status).headers(headers).body(body);
    }

    private static ResponseEntity<ApiError> databaseUnavailable() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .header(HttpHeaders.RETRY_AFTER, Long.toString(DATABASE_RETRY_AFTER_SECONDS))
                .body(ApiError.of("SERVICE_UNAVAILABLE", "We're having trouble right now. Please try again in a minute."));
    }

    /** SQL state class 08 is "connection exception": the database is down or unreachable. */
    private static boolean isConnectionFailure(Throwable ex) {
        for (Throwable t = ex; t != null; t = t.getCause()) {
            if (t instanceof SQLException sql && sql.getSQLState() != null && sql.getSQLState().startsWith("08")) {
                return true;
            }
        }
        return false;
    }

    private static String sqlState(Throwable ex) {
        for (Throwable t = ex; t != null; t = t.getCause()) {
            if (t instanceof SQLException sql && sql.getSQLState() != null) {
                return sql.getSQLState();
            }
        }
        return "unknown";
    }
}
