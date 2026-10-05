package com.sahyatri.common.health;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * Public health: is the app up and can it reach the database? 200 when both are, 503 when the database isn't, so
 * the uptime check and the load balancer see a real failure. Says nothing about versions or hosts.
 */
@RestController
@RequestMapping("/api/public")
public class HealthController {

    private static final Logger log = LoggerFactory.getLogger(HealthController.class);

    private final JdbcTemplate jdbc;

    public HealthController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        boolean databaseUp;
        try {
            Integer one = jdbc.queryForObject("SELECT 1", Integer.class);
            databaseUp = one != null && one == 1;
        } catch (DataAccessException e) {
            log.warn("Health check: database unreachable: {}", e.getMessage());
            databaseUp = false;
        }
        return ResponseEntity.status(databaseUp ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE)
                .header("Cache-Control", "no-store")
                .body(Map.of(
                        "status", databaseUp ? "ok" : "degraded",
                        "database", databaseUp ? "up" : "down",
                        "server_time", Instant.now().toString()));
    }
}
