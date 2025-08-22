package com.tinambu.tours.repository;

import com.tinambu.tours.entity.usuario.Usuario;
import com.tinambu.tours.entity.usuario.TipoUsuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    /**
     * Buscar usuario por email (usado para autenticación) - ESENCIAL
     */
    Optional<Usuario> findByEmail(String email);

    /**
     * Verificar si existe un usuario con el email dado - ESENCIAL
     */
    boolean existsByEmail(String email);

    /**
     * Buscar usuarios por tipo - SIMPLIFICADO
     */
    List<Usuario> findByTipo(TipoUsuario tipo);

    /**
     * Buscar usuarios activos - SIMPLIFICADO
     */
    List<Usuario> findByActivoTrue();

    /**
     * Buscar usuarios por tipo y estado activo - SIMPLIFICADO
     */
    List<Usuario> findByTipoAndActivoTrue(TipoUsuario tipo);

    /**
     * Contar usuarios por tipo y estado activo - ESENCIAL PARA USUARIOSERVICE
     */
    long countByTipoAndActivoTrue(TipoUsuario tipo);

    /**
     * Buscar por nombre - SIMPLIFICADO
     */
    List<Usuario> findByNombreCompletoContainingIgnoreCaseAndActivoTrue(String nombre);

    /**
     * Buscar administradores activos - SIMPLIFICADO
     */
    List<Usuario> findByTipoAndActivoTrueOrderByFechaCreacion(TipoUsuario tipo);
}