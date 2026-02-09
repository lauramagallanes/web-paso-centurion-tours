package com.tinambu.tours.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Filtro de rate limiting para endpoints de autenticación (B1).
 * Limita intentos por IP para prevenir ataques de fuerza bruta.
 * 
 * Nota: En Lambda, el estado se mantiene por instancia warm.
 * Para rate limiting distribuido se necesitaría DynamoDB/ElastiCache.
 */
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitFilter.class);

    // Máximo de intentos por ventana de tiempo
    private static final int MAX_ATTEMPTS = 10;
    // Ventana de tiempo en segundos
    private static final int WINDOW_SECONDS = 300; // 5 minutos
    // Tiempo de bloqueo en segundos después de exceder el límite
    private static final int BLOCK_SECONDS = 600; // 10 minutos

    private final ConcurrentHashMap<String, AttemptRecord> attempts = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String clientIp = getClientIp(request);
        String key = clientIp + ":" + request.getRequestURI();

        AttemptRecord record = attempts.compute(key, (k, existing) -> {
            Instant now = Instant.now();

            if (existing == null) {
                return new AttemptRecord(1, now, null);
            }

            // Si está bloqueado, verificar si el bloqueo expiró
            if (existing.blockedUntil != null && now.isBefore(existing.blockedUntil)) {
                return existing; // sigue bloqueado
            }

            // Si la ventana expiró, resetear
            if (now.isAfter(existing.windowStart.plusSeconds(WINDOW_SECONDS))) {
                return new AttemptRecord(1, now, null);
            }

            // Incrementar intentos dentro de la ventana
            int newCount = existing.count + 1;
            Instant blocked = null;

            if (newCount > MAX_ATTEMPTS) {
                blocked = now.plusSeconds(BLOCK_SECONDS);
                logger.warn("Rate limit exceeded for IP: {} on {}", clientIp, request.getRequestURI());
            }

            return new AttemptRecord(newCount, existing.windowStart, blocked);
        });

        // Si está bloqueado, rechazar
        if (record.blockedUntil != null && Instant.now().isBefore(record.blockedUntil)) {
            long retryAfter = record.blockedUntil.getEpochSecond() - Instant.now().getEpochSecond();
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setHeader("Retry-After", String.valueOf(retryAfter));
            response.getWriter().write(
                "{\"success\":false,\"error\":\"Demasiados intentos. Intenta de nuevo en " 
                + (retryAfter / 60) + " minutos.\",\"status\":429}"
            );
            return;
        }

        chain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        // Solo aplicar rate limiting a endpoints sensibles
        return !path.equals("/auth/login") 
            && !path.equals("/auth/signup") 
            && !path.equals("/auth/refresh");
    }

    private String getClientIp(HttpServletRequest request) {
        // Considerar headers de proxy/load balancer
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isEmpty()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * Limpiar registros expirados (se ejecuta periódicamente de forma lazy)
     */
    private void cleanupExpired() {
        Instant now = Instant.now();
        attempts.entrySet().removeIf(entry -> {
            AttemptRecord r = entry.getValue();
            // Limpiar si la ventana expiró y no está bloqueado
            if (r.blockedUntil != null) {
                return now.isAfter(r.blockedUntil);
            }
            return now.isAfter(r.windowStart.plusSeconds(WINDOW_SECONDS));
        });
    }

    private static class AttemptRecord {
        final int count;
        final Instant windowStart;
        final Instant blockedUntil;

        AttemptRecord(int count, Instant windowStart, Instant blockedUntil) {
            this.count = count;
            this.windowStart = windowStart;
            this.blockedUntil = blockedUntil;
        }
    }
}
