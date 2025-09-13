package com.tinambu.tours.repository;

import com.tinambu.tours.entity.sendero.Sendero;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Repositorio ultra-básico para entidad Sendero - solo métodos heredados
 */
@Repository
public interface SenderoRepository extends JpaRepository<Sendero, UUID> {
    
    // Solo métodos básicos heredados de JpaRepository:
    // findAll(), findById(), save(), deleteById(), etc.
    
    // NO custom queries para evitar problemas de named queries
}