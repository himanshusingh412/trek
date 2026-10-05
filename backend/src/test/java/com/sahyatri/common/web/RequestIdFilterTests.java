package com.sahyatri.common.web;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class RequestIdFilterTests {

    private final RequestIdFilter filter = new RequestIdFilter();

    private String run(String given, MockHttpServletResponse response, AtomicReference<String> seenInside)
            throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/public/health");
        if (given != null) request.addHeader(RequestIdFilter.HEADER, given);
        filter.doFilter(request, response, (req, res) -> seenInside.set(RequestIdFilter.current()));
        return response.getHeader(RequestIdFilter.HEADER);
    }

    @Test
    void keepsAWellFormedCallerId() throws Exception {
        AtomicReference<String> inside = new AtomicReference<>();
        assertThat(run("abc-123_DEF.456", new MockHttpServletResponse(), inside)).isEqualTo("abc-123_DEF.456");
        assertThat(inside.get()).isEqualTo("abc-123_DEF.456");
        assertThat(RequestIdFilter.current()).isNull(); // cleared after the request
    }

    @Test
    void replacesMissingOrUnsafeIds() throws Exception {
        AtomicReference<String> inside = new AtomicReference<>();
        String generated = run(null, new MockHttpServletResponse(), inside);
        assertThat(generated).matches("[0-9a-f-]{36}");

        String injected = run("evil\nFAKE LOG LINE", new MockHttpServletResponse(), inside);
        assertThat(injected).matches("[0-9a-f-]{36}");
        assertThat(inside.get()).isEqualTo(injected);
    }
}
