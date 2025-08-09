package com.tinambu.tours.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collection;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

/**
 * Tests unitarios para JwtUtil
 * Prueba la generación, validación y extracción de datos de tokens JWT
 */
@ExtendWith(MockitoExtension.class)
class JwtUtilTest {

    private JwtUtil jwtUtil;

    @Mock
    private UserDetails userDetails;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        
        // Configurar propiedades usando reflection para testing
        ReflectionTestUtils.setField(jwtUtil, "secret", 
            "test-secret-key-for-jwt-testing-must-be-at-least-256-bits-long-for-security");
        ReflectionTestUtils.setField(jwtUtil, "jwtExpiration", 3600000); // 1 hora
        
        // Configurar mock de UserDetails
        when(userDetails.getUsername()).thenReturn("test@example.com");
        when(userDetails.getAuthorities()).thenReturn(
            List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }

    @Test
    void generateToken_DeberiaGenerarTokenValido() {
        // When
        String token = jwtUtil.generateToken(userDetails);

        // Then
        assertNotNull(token);
        assertFalse(token.isEmpty());
        assertTrue(token.split("\\.").length == 3); // JWT debe tener 3 partes separadas por puntos
    }

    @Test
    void extractUsername_DeberiaExtraerUsernameCorrectamente() {
        // Given
        String token = jwtUtil.generateToken(userDetails);

        // When
        String username = jwtUtil.extractUsername(token);

        // Then
        assertEquals("test@example.com", username);
    }

    @Test
    void validateToken_DeberiaRetornarTrueParaTokenValido() {
        // Given
        String token = jwtUtil.generateToken(userDetails);

        // When
        Boolean isValid = jwtUtil.validateToken(token, userDetails);

        // Then
        assertTrue(isValid);
    }

    @Test
    void validateToken_DeberiaRetornarFalseParaTokenInvalido() {
        // Given
        String tokenInvalido = "token.invalido.aqui";

        // When
        Boolean isValid = jwtUtil.validateToken(tokenInvalido, userDetails);

        // Then
        assertFalse(isValid);
    }

    @Test
    void isValidToken_DeberiaRetornarTrueParaTokenValido() {
        // Given
        String token = jwtUtil.generateToken(userDetails);

        // When
        Boolean isValid = jwtUtil.isValidToken(token);

        // Then
        assertTrue(isValid);
    }

    @Test
    void isValidToken_DeberiaRetornarFalseParaTokenInvalido() {
        // Given
        String tokenInvalido = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature";

        // When
        Boolean isValid = jwtUtil.isValidToken(tokenInvalido);

        // Then
        assertFalse(isValid);
    }

    @Test
    void generateRefreshToken_DeberiaGenerarTokenDeRefresh() {
        // When
        String refreshToken = jwtUtil.generateRefreshToken(userDetails);

        // Then
        assertNotNull(refreshToken);
        assertFalse(refreshToken.isEmpty());
        assertTrue(refreshToken.split("\\.").length == 3);
    }

    @Test
    void isRefreshToken_DeberiaRetornarTrueParaRefreshToken() {
        // Given
        String refreshToken = jwtUtil.generateRefreshToken(userDetails);

        // When
        Boolean isRefresh = jwtUtil.isRefreshToken(refreshToken);

        // Then
        assertTrue(isRefresh);
    }

    @Test
    void isRefreshToken_DeberiaRetornarFalseParaAccessToken() {
        // Given
        String accessToken = jwtUtil.generateToken(userDetails);

        // When
        Boolean isRefresh = jwtUtil.isRefreshToken(accessToken);

        // Then
        assertFalse(isRefresh);
    }

    @Test
    void extractRoles_DeberiaExtraerRolesCorrectamente() {
        // Given
        String token = jwtUtil.generateToken(userDetails);

        // When
        List<String> roles = jwtUtil.extractRoles(token);

        // Then
        assertNotNull(roles);
        assertFalse(roles.isEmpty());
        assertTrue(roles.contains("ROLE_USER"));
    }

    @Test
    void getTokenRemainingTime_DeberiaRetornarTiempoRestante() {
        // Given
        String token = jwtUtil.generateToken(userDetails);

        // When
        Long remainingTime = jwtUtil.getTokenRemainingTime(token);

        // Then
        assertNotNull(remainingTime);
        assertTrue(remainingTime > 0);
        assertTrue(remainingTime <= 3600000); // No más de 1 hora
    }

    @Test
    void extractExpiration_DeberiaExtraerFechaDeExpiracion() {
        // Given
        String token = jwtUtil.generateToken(userDetails);

        // When
        var expiration = jwtUtil.extractExpiration(token);

        // Then
        assertNotNull(expiration);
        assertTrue(expiration.getTime() > System.currentTimeMillis());
    }

    @Test
    void validateToken_DeberiaRetornarFalseParaUsuarioIncorrecto() {
        // Given
        String token = jwtUtil.generateToken(userDetails);
        
        // Mock de otro usuario
        UserDetails otroUsuario = new UserDetails() {
            @Override
            public Collection<? extends GrantedAuthority> getAuthorities() {
                return List.of(new SimpleGrantedAuthority("ROLE_USER"));
            }

            @Override
            public String getPassword() {
                return "password";
            }

            @Override
            public String getUsername() {
                return "otro@example.com";
            }

            @Override
            public boolean isAccountNonExpired() {
                return true;
            }

            @Override
            public boolean isAccountNonLocked() {
                return true;
            }

            @Override
            public boolean isCredentialsNonExpired() {
                return true;
            }

            @Override
            public boolean isEnabled() {
                return true;
            }
        };

        // When
        Boolean isValid = jwtUtil.validateToken(token, otroUsuario);

        // Then
        assertFalse(isValid);
    }
}
