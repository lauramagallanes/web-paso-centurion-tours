package com.tinambu.tours.service;

import com.tinambu.tours.entity.usuario.TipoUsuario;
import com.tinambu.tours.entity.usuario.Usuario;
import com.tinambu.tours.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios para UsuarioService
 * Utiliza Mockito para simular dependencias
 */
@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UsuarioService usuarioService;

    private Usuario usuarioMock;
    private UUID usuarioId;

    @BeforeEach
    void setUp() {
        usuarioId = UUID.randomUUID();
        usuarioMock = new Usuario();
        usuarioMock.setId(usuarioId);
        usuarioMock.setEmail("test@example.com");
        usuarioMock.setPassword("hashedPassword");
        usuarioMock.setNombreCompleto("Test User");
        usuarioMock.setTipo(TipoUsuario.VISITANTE);
        usuarioMock.setActivo(true);
        usuarioMock.setFechaCreacion(LocalDateTime.now());
    }

    @Test
    void crearUsuario_DeberiaCrearUsuarioExitosamente() {
        // Given
        Usuario nuevoUsuario = new Usuario("nuevo@test.com", "password123", "Nuevo Usuario", TipoUsuario.VISITANTE);
        when(usuarioRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashedPassword");
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuarioMock);

        // When
        Usuario resultado = usuarioService.crearUsuario(nuevoUsuario);

        // Then
        assertNotNull(resultado);
        assertEquals("test@example.com", resultado.getEmail());
        verify(usuarioRepository).existsByEmail("nuevo@test.com");
        verify(passwordEncoder).encode("password123");
        verify(usuarioRepository).save(nuevoUsuario);
    }

    @Test
    void crearUsuario_DeberiaLanzarExcepcionSiEmailExiste() {
        // Given
        Usuario usuarioExistente = new Usuario("existe@test.com", "password", "Usuario", TipoUsuario.VISITANTE);
        when(usuarioRepository.existsByEmail("existe@test.com")).thenReturn(true);

        // When & Then
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> usuarioService.crearUsuario(usuarioExistente)
        );
        
        assertEquals("Ya existe un usuario con el email: existe@test.com", exception.getMessage());
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void crearAdministrador_DeberiaCrearAdminCorrectamente() {
        // Given
        when(usuarioRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashedPassword");
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuarioMock);

        // When
        Usuario admin = usuarioService.crearAdministrador("admin@test.com", "adminPass", "Administrador");

        // Then
        assertNotNull(admin);
        verify(usuarioRepository).save(any(Usuario.class));
    }

    @Test
    void loadUserByUsername_DeberiaRetornarUsuario() {
        // Given
        when(usuarioRepository.findByEmail("test@example.com")).thenReturn(Optional.of(usuarioMock));

        // When
        UserDetails userDetails = usuarioService.loadUserByUsername("test@example.com");

        // Then
        assertNotNull(userDetails);
        assertEquals("test@example.com", userDetails.getUsername());
        verify(usuarioRepository).findByEmail("test@example.com");
    }

    @Test
    void loadUserByUsername_DeberiaLanzarExcepcionSiUsuarioNoExiste() {
        // Given
        when(usuarioRepository.findByEmail("noexiste@test.com")).thenReturn(Optional.empty());

        // When & Then
        UsernameNotFoundException exception = assertThrows(
            UsernameNotFoundException.class,
            () -> usuarioService.loadUserByUsername("noexiste@test.com")
        );
        
        assertEquals("Usuario no encontrado: noexiste@test.com", exception.getMessage());
    }

    @Test
    void validarCredenciales_DeberiaRetornarTrueSiCredencialesSonCorrectas() {
        // Given
        when(usuarioRepository.findByEmail("test@example.com")).thenReturn(Optional.of(usuarioMock));
        when(passwordEncoder.matches("password123", "hashedPassword")).thenReturn(true);

        // When
        boolean resultado = usuarioService.validarCredenciales("test@example.com", "password123");

        // Then
        assertTrue(resultado);
        verify(passwordEncoder).matches("password123", "hashedPassword");
    }

    @Test
    void validarCredenciales_DeberiaRetornarFalseSiPasswordIncorrecta() {
        // Given
        when(usuarioRepository.findByEmail("test@example.com")).thenReturn(Optional.of(usuarioMock));
        when(passwordEncoder.matches("wrongPassword", "hashedPassword")).thenReturn(false);

        // When
        boolean resultado = usuarioService.validarCredenciales("test@example.com", "wrongPassword");

        // Then
        assertFalse(resultado);
    }

    @Test
    void validarCredenciales_DeberiaRetornarFalseSiUsuarioInactivo() {
        // Given
        usuarioMock.setActivo(false);
        when(usuarioRepository.findByEmail("test@example.com")).thenReturn(Optional.of(usuarioMock));

        // When
        boolean resultado = usuarioService.validarCredenciales("test@example.com", "password123");

        // Then
        assertFalse(resultado);
    }

    @Test
    void obtenerUsuarioPorId_DeberiaRetornarUsuario() {
        // Given
        when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuarioMock));

        // When
        Usuario resultado = usuarioService.obtenerUsuarioPorId(usuarioId);

        // Then
        assertNotNull(resultado);
        assertEquals(usuarioId, resultado.getId());
        verify(usuarioRepository).findById(usuarioId);
    }

    @Test
    void obtenerUsuariosPorTipo_DeberiaRetornarListaFiltrada() {
        // Given
        List<Usuario> usuarios = Arrays.asList(usuarioMock);
        when(usuarioRepository.findByTipoAndActivoTrue(TipoUsuario.VISITANTE)).thenReturn(usuarios);

        // When
        List<Usuario> resultado = usuarioService.obtenerUsuariosPorTipo(TipoUsuario.VISITANTE);

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        assertEquals(TipoUsuario.VISITANTE, resultado.get(0).getTipo());
        verify(usuarioRepository).findByTipoAndActivoTrue(TipoUsuario.VISITANTE);
    }

    @Test
    void cambiarContrasena_DeberiaCambiarContrasenaCorrectamente() {
        // Given
        when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuarioMock));
        when(passwordEncoder.encode("nuevaPassword")).thenReturn("nuevaHashedPassword");
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuarioMock);

        // When
        usuarioService.cambiarContrasena(usuarioId, "nuevaPassword");

        // Then
        verify(passwordEncoder).encode("nuevaPassword");
        verify(usuarioRepository).save(usuarioMock);
    }

    @Test
    void cambiarEstadoUsuario_DeberiaCambiarEstadoCorrectamente() {
        // Given
        when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuarioMock));
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuarioMock);

        // When
        Usuario resultado = usuarioService.cambiarEstadoUsuario(usuarioId, false);

        // Then
        assertNotNull(resultado);
        verify(usuarioRepository).save(usuarioMock);
    }

    @Test
    void existeUsuarioConEmail_DeberiaRetornarTrue() {
        // Given
        when(usuarioRepository.existsByEmail("test@example.com")).thenReturn(true);

        // When
        boolean resultado = usuarioService.existeUsuarioConEmail("test@example.com");

        // Then
        assertTrue(resultado);
        verify(usuarioRepository).existsByEmail("test@example.com");
    }
}
