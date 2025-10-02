package com.tinambu.tours.service;

import com.tinambu.tours.dto.request.UsuarioRequest;
import com.tinambu.tours.dto.request.UsuarioUpdateRequest;
import com.tinambu.tours.dto.request.CambioPasswordRequest;
import com.tinambu.tours.dto.response.UsuarioResponse;
import com.tinambu.tours.entity.usuario.TipoUsuario;
import com.tinambu.tours.entity.usuario.Usuario;
import com.tinambu.tours.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class UsuarioService implements UserDetailsService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Crear nuevo usuario
     */
    public UsuarioResponse crearUsuario(UsuarioRequest usuarioRequest) {
        // Validar que el email no esté duplicado
        if (usuarioRepository.existsByEmail(usuarioRequest.getEmail())) {
            throw new IllegalArgumentException("Ya existe un usuario con el email: " + usuarioRequest.getEmail());
        }

        // Convertir DTO a entidad
        Usuario usuario = convertirRequestAEntidad(usuarioRequest);
        
        // Encriptar contraseña
        usuario.setPassword(passwordEncoder.encode(usuarioRequest.getPassword()));

        Usuario usuarioGuardado = usuarioRepository.save(usuario);
        return convertirEntidadAResponse(usuarioGuardado);
    }

    /**
     * Crear administrador
     */
    public UsuarioResponse crearAdministrador(String email, String password, String nombreCompleto) {
        UsuarioRequest adminRequest = new UsuarioRequest(email, password, nombreCompleto, TipoUsuario.ADMIN);
        return crearUsuario(adminRequest);
    }

    /**
     * Crear visitante
     */
    public UsuarioResponse crearVisitante(String email, String password, String nombreCompleto) {
        UsuarioRequest visitanteRequest = new UsuarioRequest(email, password, nombreCompleto, TipoUsuario.VISITANTE);
        return crearUsuario(visitanteRequest);
    }

    /**
     * Actualizar usuario existente
     */
    public UsuarioResponse actualizarUsuario(UUID id, UsuarioUpdateRequest usuarioUpdateRequest) {
        Usuario usuario = obtenerUsuarioEntidadPorId(id);

        // Verificar si cambió el email y si ya existe
        if (!usuario.getEmail().equals(usuarioUpdateRequest.getEmail()) &&
            usuarioRepository.existsByEmail(usuarioUpdateRequest.getEmail())) {
            throw new IllegalArgumentException("Ya existe un usuario con el email: " + usuarioUpdateRequest.getEmail());
        }

        // Actualizar campos (sin cambiar contraseña aquí)
        usuario.setEmail(usuarioUpdateRequest.getEmail());
        usuario.setNombreCompleto(usuarioUpdateRequest.getNombreCompleto());
        usuario.setTipo(usuarioUpdateRequest.getTipo());

        Usuario usuarioActualizado = usuarioRepository.save(usuario);
        return convertirEntidadAResponse(usuarioActualizado);
    }

    /**
     * Cambiar contraseña de usuario
     */
    public void cambiarContrasena(UUID id, CambioPasswordRequest cambioPasswordRequest) {
        // Validar que las contraseñas coincidan
        if (!cambioPasswordRequest.passwordsMatch()) {
            throw new IllegalArgumentException("Las contraseñas no coinciden");
        }
        
        Usuario usuario = obtenerUsuarioEntidadPorId(id);
        usuario.setPassword(passwordEncoder.encode(cambioPasswordRequest.getNuevaPassword()));
        usuarioRepository.save(usuario);
    }

    /**
     * Activar/desactivar usuario
     */
    public UsuarioResponse cambiarEstadoUsuario(UUID id, boolean activo) {
        Usuario usuario = obtenerUsuarioEntidadPorId(id);
        usuario.setActivo(activo);
        Usuario usuarioActualizado = usuarioRepository.save(usuario);
        return convertirEntidadAResponse(usuarioActualizado);
    }

    /**
     * Validar credenciales de usuario
     */
    @Transactional(readOnly = true)
    public boolean validarCredenciales(String email, String password) {
        try {
            Usuario usuario = obtenerUsuarioEntidadPorEmail(email);
            return usuario.getActivo() && passwordEncoder.matches(password, usuario.getPassword());
        } catch (Exception e) {
            return false;
        }
    }

    // Implementación de UserDetailsService para Spring Security
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return usuarioRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + email));
    }

    // ========== MÉTODOS PÚBLICOS QUE DEVUELVEN DTOs ==========
    
    @Transactional(readOnly = true)
    public UsuarioResponse obtenerUsuarioPorId(UUID id) {
        Usuario usuario = obtenerUsuarioEntidadPorId(id);
        return convertirEntidadAResponse(usuario);
    }

    @Transactional(readOnly = true)
    public UsuarioResponse obtenerUsuarioPorEmail(String email) {
        Usuario usuario = obtenerUsuarioEntidadPorEmail(email);
        return convertirEntidadAResponse(usuario);
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponse> obtenerTodosLosUsuarios() {
        List<Usuario> usuarios = usuarioRepository.findAll();
        return usuarios.stream()
                .map(this::convertirEntidadAResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponse> obtenerUsuariosActivos() {
        List<Usuario> usuarios = usuarioRepository.findByActivoTrue();
        return usuarios.stream()
                .map(this::convertirEntidadAResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponse> obtenerUsuariosPorTipo(TipoUsuario tipo) {
        List<Usuario> usuarios = usuarioRepository.findByTipoAndActivoTrue(tipo);
        return usuarios.stream()
                .map(this::convertirEntidadAResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponse> obtenerAdministradores() {
        List<Usuario> usuarios = usuarioRepository.findByTipoAndActivoTrueOrderByFechaCreacion(TipoUsuario.ADMIN);
        return usuarios.stream()
                .map(this::convertirEntidadAResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponse> buscarPorNombre(String nombre) {
        List<Usuario> usuarios = usuarioRepository.findByNombreCompletoContainingIgnoreCaseAndActivoTrue(nombre);
        return usuarios.stream()
                .map(this::convertirEntidadAResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long contarUsuariosPorTipo(TipoUsuario tipo) {
        return usuarioRepository.countByTipoAndActivoTrue(tipo);
    }

    @Transactional(readOnly = true)
    public boolean existeUsuarioConEmail(String email) {
        return usuarioRepository.existsByEmail(email);
    }

    /**
     * Eliminar usuario (soft delete - desactivar)
     */
    public void eliminarUsuario(UUID id) {
        cambiarEstadoUsuario(id, false);
    }

    /**
     * Obtener estadísticas de usuarios
     */
    @Transactional(readOnly = true)
    public UsuarioStats obtenerEstadisticas() {
        long totalUsuarios = usuarioRepository.count();
        long usuariosActivos = usuarioRepository.findByActivoTrue().size();
        long administradores = usuarioRepository.countByTipoAndActivoTrue(TipoUsuario.ADMIN);
        long visitantes = usuarioRepository.countByTipoAndActivoTrue(TipoUsuario.VISITANTE);

        return new UsuarioStats(totalUsuarios, usuariosActivos, administradores, visitantes);
    }

    // ========== MÉTODOS PRIVADOS PARA USO INTERNO (Entidades) ==========
    
    /**
     * Método interno para obtener entidad Usuario por ID
     * Solo para uso interno del servicio
     */
    @Transactional(readOnly = true)
    private Usuario obtenerUsuarioEntidadPorId(UUID id) {
        return usuarioRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
    }

    /**
     * Método interno para obtener entidad Usuario por email
     * Solo para uso interno del servicio
     */
    @Transactional(readOnly = true)
    private Usuario obtenerUsuarioEntidadPorEmail(String email) {
        return usuarioRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con email: " + email));
    }

    // ========== MÉTODOS DE CONVERSIÓN ==========

    /**
     * Convierte un UsuarioRequest DTO a entidad Usuario
     */
    private Usuario convertirRequestAEntidad(UsuarioRequest request) {
        Usuario usuario = new Usuario();
        usuario.setEmail(request.getEmail());
        usuario.setNombreCompleto(request.getNombreCompleto());
        usuario.setTipo(request.getTipo());
        // La contraseña se setea por separado después del encode en el método que llama
        return usuario;
    }

    /**
     * Convierte una entidad Usuario a UsuarioResponse DTO
     */
    private UsuarioResponse convertirEntidadAResponse(Usuario usuario) {
        return new UsuarioResponse(usuario);
    }

    // Clase interna para estadísticas
    public static class UsuarioStats {
        private final long totalUsuarios;
        private final long usuariosActivos;
        private final long administradores;
        private final long visitantes;

        public UsuarioStats(long totalUsuarios, long usuariosActivos, 
                           long administradores, long visitantes) {
            this.totalUsuarios = totalUsuarios;
            this.usuariosActivos = usuariosActivos;
            this.administradores = administradores;
            this.visitantes = visitantes;
        }

        // Getters
        public long getTotalUsuarios() { return totalUsuarios; }
        public long getUsuariosActivos() { return usuariosActivos; }
        public long getAdministradores() { return administradores; }
        public long getVisitantes() { return visitantes; }
    }
}
