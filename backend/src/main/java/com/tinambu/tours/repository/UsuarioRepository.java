package com.tinambu.tours.repository;

import com.tinambu.tours.entity.usuario.TipoUsuario;
import com.tinambu.tours.entity.usuario.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio para entidad Usuario con métodos personalizados
 */
@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {
    
    /**
     * Buscar usuario por email
     */
    Optional<Usuario> findByEmail(String email);
    
    /**
     * Verificar si existe usuario por email
     */
    boolean existsByEmail(String email);
    
    /**
     * Buscar usuarios activos
     */
    List<Usuario> findByActivoTrue();
    
    /**
     * Buscar usuarios por tipo y activos
     */
    List<Usuario> findByTipoAndActivoTrue(TipoUsuario tipo);
    
    /**
     * Buscar usuarios por tipo y activos ordenados por fecha de creación
     */
    List<Usuario> findByTipoAndActivoTrueOrderByFechaCreacion(TipoUsuario tipo);
    
    /**
     * Buscar usuarios activos por nombre que contenga texto
     */
    List<Usuario> findByNombreCompletoContainingIgnoreCaseAndActivoTrue(String nombre);
    
    /**
     * Contar usuarios activos por tipo
     */
    long countByTipoAndActivoTrue(TipoUsuario tipo);
}