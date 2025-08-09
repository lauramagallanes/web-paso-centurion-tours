package com.tinambu.tours.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tinambu.tours.dto.request.LoginRequest;
import com.tinambu.tours.dto.request.SignupRequest;
import com.tinambu.tours.entity.usuario.TipoUsuario;
import com.tinambu.tours.entity.usuario.Usuario;
import com.tinambu.tours.security.JwtUtil;
import com.tinambu.tours.service.UsuarioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests de integración para AuthController
 * Utiliza MockMvc para probar endpoints REST
 */
@WebMvcTest(AuthController.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthenticationManager authenticationManager;

    @MockBean
    private UsuarioService usuarioService;

    @MockBean
    private JwtUtil jwtUtil;

    @Autowired
    private ObjectMapper objectMapper;

    private Usuario usuarioMock;
    private LoginRequest loginRequest;
    private SignupRequest signupRequest;

    @BeforeEach
    void setUp() {
        usuarioMock = new Usuario();
        usuarioMock.setId(UUID.randomUUID());
        usuarioMock.setEmail("test@example.com");
        usuarioMock.setNombreCompleto("Test User");
        usuarioMock.setTipo(TipoUsuario.VISITANTE);
        usuarioMock.setActivo(true);
        usuarioMock.setFechaCreacion(LocalDateTime.now());

        loginRequest = new LoginRequest();
        loginRequest.setEmail("test@example.com");
        loginRequest.setPassword("password123");

        signupRequest = new SignupRequest();
        signupRequest.setEmail("nuevo@example.com");
        signupRequest.setPassword("password123");
        signupRequest.setNombreCompleto("Nuevo Usuario");
    }

    @Test
    void login_DeberiaRetornarJwtTokenCuandoCredencialesSonCorrectas() throws Exception {
        // Given
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
            .thenReturn(null); // Autenticación exitosa
        when(usuarioService.loadUserByUsername("test@example.com")).thenReturn(usuarioMock);
        when(usuarioService.obtenerUsuarioPorEmail("test@example.com")).thenReturn(usuarioMock);
        when(jwtUtil.generateToken(any(UserDetails.class))).thenReturn("access-token");
        when(jwtUtil.generateRefreshToken(any(UserDetails.class))).thenReturn("refresh-token");

        // When & Then
        mockMvc.perform(post("/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Login exitoso"))
                .andExpect(jsonPath("$.data.accessToken").value("access-token"))
                .andExpect(jsonPath("$.data.refreshToken").value("refresh-token"))
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.usuario.email").value("test@example.com"));
    }

    @Test
    void login_DeberiaRetornar401CuandoCredencialesSonIncorrectas() throws Exception {
        // Given
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
            .thenThrow(new BadCredentialsException("Credenciales inválidas"));

        // When & Then
        mockMvc.perform(post("/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("Credenciales inválidas"));
    }

    @Test
    void login_DeberiaRetornar403CuandoUsuarioEstaDesactivado() throws Exception {
        // Given
        usuarioMock.setActivo(false);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
            .thenReturn(null);
        when(usuarioService.loadUserByUsername("test@example.com")).thenReturn(usuarioMock);
        when(usuarioService.obtenerUsuarioPorEmail("test@example.com")).thenReturn(usuarioMock);

        // When & Then
        mockMvc.perform(post("/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpected(jsonPath("$.error").value("Usuario desactivado"));
    }

    @Test
    void signup_DeberiaCrearUsuarioExitosamente() throws Exception {
        // Given
        when(usuarioService.crearVisitante(anyString(), anyString(), anyString()))
            .thenReturn(usuarioMock);

        // When & Then
        mockMvc.perform(post("/auth/signup")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(signupRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Usuario registrado exitosamente"))
                .andExpect(jsonPath("$.data.email").value("test@example.com"))
                .andExpect(jsonPath("$.data.nombreCompleto").value("Test User"));
    }

    @Test
    void signup_DeberiaRetornar400CuandoEmailYaExiste() throws Exception {
        // Given
        when(usuarioService.crearVisitante(anyString(), anyString(), anyString()))
            .thenThrow(new IllegalArgumentException("Ya existe un usuario con el email: nuevo@example.com"));

        // When & Then
        mockMvc.perform(post("/auth/signup")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(signupRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("Ya existe un usuario con el email: nuevo@example.com"));
    }

    @Test
    void signup_DeberiaRetornar400CuandoRequestEsInvalido() throws Exception {
        // Given
        SignupRequest requestInvalido = new SignupRequest();
        requestInvalido.setEmail(""); // Email vacío
        requestInvalido.setPassword("123"); // Password muy corto
        requestInvalido.setNombreCompleto(""); // Nombre vacío

        // When & Then
        mockMvc.perform(post("/auth/signup")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestInvalido)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_DeberiaRetornar400CuandoRequestEsInvalido() throws Exception {
        // Given
        LoginRequest requestInvalido = new LoginRequest();
        requestInvalido.setEmail(""); // Email vacío
        requestInvalido.setPassword(""); // Password vacío

        // When & Then
        mockMvc.perform(post("/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestInvalido)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void refreshToken_DeberiaGenerarNuevoToken() throws Exception {
        // Given
        String refreshToken = "valid-refresh-token";
        when(jwtUtil.isValidToken(refreshToken)).thenReturn(true);
        when(jwtUtil.isRefreshToken(refreshToken)).thenReturn(true);
        when(jwtUtil.extractUsername(refreshToken)).thenReturn("test@example.com");
        when(usuarioService.loadUserByUsername("test@example.com")).thenReturn(usuarioMock);
        when(jwtUtil.generateToken(any(UserDetails.class))).thenReturn("new-access-token");

        // When & Then
        mockMvc.perform(post("/auth/refresh")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").value("new-access-token"));
    }

    @Test
    @WithMockUser
    void logout_DeberiaRetornarMensajeDeExito() throws Exception {
        // When & Then
        mockMvc.perform(post("/auth/logout")
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Logout exitoso"));
    }
}
