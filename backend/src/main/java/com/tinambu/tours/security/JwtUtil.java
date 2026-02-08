package com.tinambu.tours.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Utilidad para manejo de JWT tokens
 * Encapsula toda la lógica de generación, validación y extracción de datos de tokens
 */
@Component
public class JwtUtil {

    @Value("${spring.security.jwt.secret}")
    private String secret;

    @Value("${spring.security.jwt.expiration}")
    private int jwtExpiration;

    /**
     * Obtener la clave secreta para firmar tokens
     */
    private SecretKey getSigningKey() {
        byte[] keyBytes = secret.getBytes();
        // Asegurar que la clave tenga al menos 256 bits (32 bytes) para HMAC-SHA512
        if (keyBytes.length < 32) {
            // Expandir la clave usando SHA-256 para obtener 32 bytes
            try {
                java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
                keyBytes = md.digest(keyBytes);
            } catch (java.security.NoSuchAlgorithmException e) {
                throw new RuntimeException("SHA-256 algorithm not available", e);
            }
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Extraer username del token
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Extraer fecha de expiración del token
     */
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Extraer un claim específico del token
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Extraer todos los claims del token
     */
    private Claims extractAllClaims(String token) {
        try {
            return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        } catch (JwtException e) {
            throw new IllegalArgumentException("Token JWT inválido", e);
        }
    }

    /**
     * Verificar si el token ha expirado
     */
    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    /**
     * Generar token para un usuario
     */
    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        
        // Agregar información adicional al token
        claims.put("authorities", userDetails.getAuthorities());
        
        return createToken(claims, userDetails.getUsername());
    }

    private static final String TOKEN_ISSUER = "tinambu-tours";
    private static final String TOKEN_AUDIENCE = "tinambu-web";

    /**
     * Crear token con claims y subject específicos
     * Incluye issuer y audience para prevenir reutilización entre servicios (M3)
     */
    private String createToken(Map<String, Object> claims, String subject) {
        Date now = new Date();
        Date expirationDate = new Date(now.getTime() + jwtExpiration);

        return Jwts.builder()
            .setClaims(claims)
            .setSubject(subject)
            .setIssuer(TOKEN_ISSUER)
            .setAudience(TOKEN_AUDIENCE)
            .setIssuedAt(now)
            .setExpiration(expirationDate)
            .signWith(getSigningKey(), SignatureAlgorithm.HS256)
            .compact();
    }

    /**
     * Validar token contra UserDetails
     */
    public Boolean validateToken(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Validar token sin UserDetails (para verificación básica)
     */
    public Boolean isValidToken(String token) {
        try {
            extractAllClaims(token);
            return !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Obtener tiempo restante del token en milisegundos
     */
    public Long getTokenRemainingTime(String token) {
        try {
            Date expiration = extractExpiration(token);
            Date now = new Date();
            return Math.max(0, expiration.getTime() - now.getTime());
        } catch (Exception e) {
            return 0L;
        }
    }

    /**
     * Extraer roles/authorities del token
     */
    @SuppressWarnings("unchecked")
    public java.util.List<String> extractRoles(String token) {
        try {
            Claims claims = extractAllClaims(token);
            java.util.List<java.util.Map<String, String>> authorities = 
                (java.util.List<java.util.Map<String, String>>) claims.get("authorities");
            
            return authorities.stream()
                .map(auth -> auth.get("authority"))
                .collect(java.util.stream.Collectors.toList());
        } catch (Exception e) {
            return java.util.Collections.emptyList();
        }
    }

    /**
     * Generar token de refresh (con mayor duración)
     */
    public String generateRefreshToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "refresh");
        
        Date now = new Date();
        Date expirationDate = new Date(now.getTime() + (jwtExpiration * 7)); // 7 veces más duración
        
        return Jwts.builder()
            .setClaims(claims)
            .setSubject(userDetails.getUsername())
            .setIssuer(TOKEN_ISSUER)
            .setAudience(TOKEN_AUDIENCE)
            .setIssuedAt(now)
            .setExpiration(expirationDate)
            .signWith(getSigningKey(), SignatureAlgorithm.HS256)
            .compact();
    }

    /**
     * Verificar si es un token de refresh
     */
    public Boolean isRefreshToken(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return "refresh".equals(claims.get("type"));
        } catch (Exception e) {
            return false;
        }
    }
}
