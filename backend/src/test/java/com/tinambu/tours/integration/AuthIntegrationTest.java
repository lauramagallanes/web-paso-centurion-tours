package com.tinambu.tours.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tinambu.tours.dto.request.LoginRequest;
import com.tinambu.tours.dto.request.SignupRequest;
import com.tinambu.tours.entity.usuario.TipoUsuario;
import com.tinambu.tours.entity.usuario.Usuario;
import com.tinambu.tours.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests de integración completos para el sistema de autenticación
 * Utiliza base de datos en memoria H2 para testing
 */
@SpringBootTest
@AutoConfigureWebMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.security.jwt.secret=test-secret-key-for-integration-testing-must-be-very-long-for-security-purposes"
})
@Transactional
class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        usuarioRepository.deleteAll();
        
        // Crear usuario de prueba
        Usuario usuario = new Usuario();
        usuario.setEmail("integration@test.com");
        usuario.setPassword(passwordEncoder.encode("password123"));
        usuario.setNombreCompleto("Integration Test User");
        usuario.setTipo(TipoUsuario.VISITANTE);
        usuario.setActivo(true);
        usuarioRepository.save(usuario);
    }

    @Test
    void flujoCompletoAutenticacion_DeberiaFuncionar() throws Exception {
        // 1. Registro de nuevo usuario
        SignupRequest signupRequest = new SignupRequest();
        signupRequest.setEmail("nuevo@integration.test");
        signupRequest.setPassword("password123");
        signupRequest.setNombreCompleto("Nuevo Usuario");

        mockMvc.perform(post("/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(signupRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("nuevo@integration.test"));

        // 2. Login con usuario recién creado
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("nuevo@integration.test");
        loginRequest.setPassword("password123");

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").exists())
                .andExpect(jsonPath("$.data.refreshToken").exists())
                .andExpect(jsonPath("$.data.usuario.email").value("nuevo@integration.test"));
    }

    @Test
    void loginConUsuarioExistente_DeberiaFuncionar() throws Exception {
        // Given
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("integration@test.com");
        loginRequest.setPassword("password123");

        // When & Then
        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").exists())
                .andExpect(jsonPath("$.data.refreshToken").exists())
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.usuario.email").value("integration@test.com"))
                .andExpect(jsonPath("$.data.usuario.nombreCompleto").value("Integration Test User"));
    }

    @Test
    void loginConCredencialesIncorrectas_DeberiaFallar() throws Exception {
        // Given
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("integration@test.com");
        loginRequest.setPassword("passwordIncorrecta");

        // When & Then
        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void signupConEmailExistente_DeberiaFallar() throws Exception {
        // Given
        SignupRequest signupRequest = new SignupRequest();
        signupRequest.setEmail("integration@test.com"); // Email ya existe
        signupRequest.setPassword("password123");
        signupRequest.setNombreCompleto("Usuario Duplicado");

        // When & Then
        mockMvc.perform(post("/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(signupRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("Ya existe un usuario con el email: integration@test.com"));
    }

    @Test
    void signupConDatosInvalidos_DeberiaFallar() throws Exception {
        // Given
        SignupRequest signupRequest = new SignupRequest();
        signupRequest.setEmail("email-invalido"); // Email sin formato válido
        signupRequest.setPassword("123"); // Password muy corto
        signupRequest.setNombreCompleto(""); // Nombre vacío

        // When & Then
        mockMvc.perform(post("/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(signupRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void loginConUsuarioDesactivado_DeberiaFallar() throws Exception {
        // Given - Crear usuario desactivado
        Usuario usuarioDesactivado = new Usuario();
        usuarioDesactivado.setEmail("desactivado@test.com");
        usuarioDesactivado.setPassword(passwordEncoder.encode("password123"));
        usuarioDesactivado.setNombreCompleto("Usuario Desactivado");
        usuarioDesactivado.setTipo(TipoUsuario.VISITANTE);
        usuarioDesactivado.setActivo(false); // Usuario desactivado
        usuarioRepository.save(usuarioDesactivado);

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("desactivado@test.com");
        loginRequest.setPassword("password123");

        // When & Then
        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("Usuario desactivado"));
    }

    @Test
    void multipleSignups_DeberianCrearUsuariosUnicos() throws Exception {
        // Given
        SignupRequest usuario1 = new SignupRequest();
        usuario1.setEmail("usuario1@test.com");
        usuario1.setPassword("password123");
        usuario1.setNombreCompleto("Usuario Uno");

        SignupRequest usuario2 = new SignupRequest();
        usuario2.setEmail("usuario2@test.com");
        usuario2.setPassword("password456");
        usuario2.setNombreCompleto("Usuario Dos");

        // When & Then - Crear primer usuario
        mockMvc.perform(post("/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(usuario1)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("usuario1@test.com"));

        // When & Then - Crear segundo usuario
        mockMvc.perform(post("/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(usuario2)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("usuario2@test.com"));

        // Verificar que ambos usuarios pueden hacer login
        LoginRequest login1 = new LoginRequest();
        login1.setEmail("usuario1@test.com");
        login1.setPassword("password123");

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(login1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        LoginRequest login2 = new LoginRequest();
        login2.setEmail("usuario2@test.com");
        login2.setPassword("password456");

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(login2)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
