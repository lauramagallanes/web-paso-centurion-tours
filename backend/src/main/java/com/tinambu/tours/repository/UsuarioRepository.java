package com.tinambu.tours.repository;

import com.tinambu.tours.entity.usuario.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Repositorio ultra-básico para entidad Usuario - solo métodos heredados
 */
@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {
    
    // Solo métodos básicos heredados de JpaRepository
    // NO custom queries para evitar problemas
}