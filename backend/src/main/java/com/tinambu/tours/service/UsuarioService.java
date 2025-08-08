package com.tinambu.tours.service;

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
    public Usuario crearUsuario(Usuario usuario) {
        // Validar que el email no esté duplicado
        if (usuarioRepository.existsByEmail(usuario.getEmail())) {
            throw new IllegalArgumentException("Ya existe un usuario con el email: " + usuario.getEmail());
        }

        // Encriptar contraseña
        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));

        return usuarioRepository.save(usuario);
    }

    /**
     * Crear administrador
     */
    public Usuario crearAdministrador(String email, String password, String nombreCompleto) {
        Usuario admin = new Usuario(email, password, nombreCompleto, TipoUsuario.ADMIN);
        return crearUsuario(admin);
    }

    /**
     * Crear visitante
     */
    public Usuario crearVisitante(String email, String password, String nombreCompleto) {
        Usuario visitante = new Usuario(email, password, nombreCompleto, TipoUsuario.VISITANTE);
        return crearUsuario(visitante);
    }

    /**
     * Actualizar usuario existente
     */
    public Usuario actualizarUsuario(UUID id, Usuario usuarioActualizado) {
        Usuario usuario = obtenerUsuarioPorId(id);

        // Verificar si cambió el email y si ya existe
        if (!usuario.getEmail().equals(usuarioActualizado.getEmail()) &&
            usuarioRepository.existsByEmail(usuarioActualizado.getEmail())) {
            throw new IllegalArgumentException("Ya existe un usuario con el email: " + usuarioActualizado.getEmail());
        }

        // Actualizar campos (sin cambiar contraseña aquí)
        usuario.setEmail(usuarioActualizado.getEmail());
        usuario.setNombreCompleto(usuarioActualizado.getNombreCompleto());
        usuario.setTipo(usuarioActualizado.getTipo());

        return usuarioRepository.save(usuario);
    }

    /**
     * Cambiar contraseña de usuario
     */
    public void cambiarContrasena(UUID id, String nuevaContrasena) {
        Usuario usuario = obtenerUsuarioPorId(id);
        usuario.setPassword(passwordEncoder.encode(nuevaContrasena));
        usuarioRepository.save(usuario);
    }

    /**
     * Activar/desactivar usuario
     */
    public Usuario cambiarEstadoUsuario(UUID id, boolean activo) {
        Usuario usuario = obtenerUsuarioPorId(id);
        usuario.setActivo(activo);
        return usuarioRepository.save(usuario);
    }

    /**
     * Validar credenciales de usuario
     */
    @Transactional(readOnly = true)
    public boolean validarCredenciales(String email, String password) {
        try {
            Usuario usuario = obtenerUsuarioPorEmail(email);
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

    // Métodos de consulta básicos
    @Transactional(readOnly = true)
    public Usuario obtenerUsuarioPorId(UUID id) {
        return usuarioRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
    }

    @Transactional(readOnly = true)
    public Usuario obtenerUsuarioPorEmail(String email) {
        return usuarioRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con email: " + email));
    }

    @Transactional(readOnly = true)
    public List<Usuario> obtenerTodosLosUsuarios() {
        return usuarioRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Usuario> obtenerUsuariosActivos() {
        return usuarioRepository.findByActivoTrue();
    }

    @Transactional(readOnly = true)
    public List<Usuario> obtenerUsuariosPorTipo(TipoUsuario tipo) {
        return usuarioRepository.findByTipoAndActivoTrue(tipo);
    }

    @Transactional(readOnly = true)
    public List<Usuario> obtenerAdministradores() {
        return usuarioRepository.findAdministradoresActivos();
    }

    @Transactional(readOnly = true)
    public List<Usuario> buscarPorNombre(String nombre) {
        return usuarioRepository.findByNombreCompletoContainingIgnoreCaseAndActivoTrue(nombre);
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
