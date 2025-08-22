package com.tinambu.tours.repository;

import com.tinambu.tours.entity.usuario.Usuario;
import com.tinambu.tours.entity.usuario.TipoUsuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    /**
     * Buscar usuario por email (usado para autenticación)
     */
    Optional<Usuario> findByEmail(String email);

    /**
     * Verificar si existe un usuario con el email dado
     */
    boolean existsByEmail(String email);

    /**
     * Buscar usuarios por tipo
     */
    List<Usuario> findByTipo(TipoUsuario tipo);

    /**
     * Buscar usuarios activos
     */
    List<Usuario> findByActivoTrue();

    /**
     * Buscar usuarios por tipo y estado activo
     */
    List<Usuario> findByTipoAndActivoTrue(TipoUsuario tipo);

    /**
     * Buscar usuarios por nombre completo (búsqueda parcial, case-insensitive)
     */
    @Query("SELECT u FROM Usuario u WHERE LOWER(u.nombreCompleto) LIKE LOWER(CONCAT('%', :nombre, '%')) AND u.activo = true")
    List<Usuario> findByNombreCompletoContainingIgnoreCaseAndActivoTrue(@Param("nombre") String nombre);

    /**
     * Contar usuarios por tipo
     */
    @Query("SELECT COUNT(u) FROM Usuario u WHERE u.tipo = :tipo AND u.activo = true")
    long countByTipoAndActivoTrue(@Param("tipo") TipoUsuario tipo);

    /**
     * Buscar administradores activos
     */
    @Query("SELECT u FROM Usuario u WHERE u.tipo = 'ADMIN' AND u.activo = true ORDER BY u.fechaCreacion")
    List<Usuario> findAdministradoresActivos();
}
