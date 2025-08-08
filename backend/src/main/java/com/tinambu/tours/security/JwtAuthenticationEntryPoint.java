package com.tinambu.tours.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Entry point de autenticación JWT
 * Se ejecuta cuando un usuario intenta acceder a un recurso protegido sin autenticación válida
 */
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request, 
                        HttpServletResponse response,
                        AuthenticationException authException) throws IOException {

        // Configurar respuesta HTTP
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        // Crear respuesta JSON estructurada
        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("error", "Acceso no autorizado");
        body.put("message", "Se requiere autenticación para acceder a este recurso");
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("path", request.getRequestURI());
        body.put("status", HttpServletResponse.SC_UNAUTHORIZED);

        // Agregar información adicional según el tipo de error
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null) {
            body.put("details", "No se proporcionó token de autenticación");
        } else if (!authHeader.startsWith("Bearer ")) {
            body.put("details", "Formato de token inválido. Use: Bearer <token>");
        } else {
            body.put("details", "Token de autenticación inválido o expirado");
        }

        // Escribir respuesta JSON
        final ObjectMapper mapper = new ObjectMapper();
        mapper.writeValue(response.getOutputStream(), body);
    }
}
