package com.questhive.questhive.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

// NOT @Component — registered manually in SecurityConfig to avoid double registration
public class RateLimitFilter extends OncePerRequestFilter {

    private final Map<String, List<Long>> attemptMap = new ConcurrentHashMap<>();
    private static final int MAX_ATTEMPTS = 20;
    private static final long WINDOW_MS = 60 * 60 * 1000L; // 1 hour

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        String method = request.getMethod();
        boolean isTargetedPath =
                path.equals("/api/auth/register") ||
                path.equals("/api/invite/request-access");
        return !("POST".equals(method) && isTargetedPath);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String ip = getClientIP(request);
        long now = System.currentTimeMillis();

        List<Long> attempts = attemptMap.computeIfAbsent(ip, k -> new ArrayList<>());

        synchronized (attempts) {
            attempts.removeIf(t -> now - t > WINDOW_MS);
            if (attempts.size() >= MAX_ATTEMPTS) {
                response.setStatus(429);
                response.setContentType("application/json");
                response.getWriter().write(
                        "{\"message\":\"Too many attempts. Please try again after 1 hour.\"}");
                return;
            }
            attempts.add(now);
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIP(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}