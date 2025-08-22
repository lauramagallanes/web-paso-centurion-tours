package com.tinambu.tours.repository;

import com.tinambu.tours.entity.guia.Guia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GuiaRepository extends JpaRepository<Guia, UUID> {

    /**
     * Buscar guías activos
     */
    List<Guia> findByActivoTrueOrderByNombreAscApellidoAsc();

    /**
     * Buscar por email
     */
    Optional<Guia> findByEmailAndActivoTrue(String email);

    /**
     * Buscar por nombre o apellido - SIMPLIFICADO
     */
    List<Guia> findByNombreContainingIgnoreCaseOrApellidoContainingIgnoreCaseAndActivoTrue(String nombre, String apellido);

    /**
     * Buscar por años de experiencia mínima - SIMPLIFICADO
     */
    List<Guia> findByAnosExperienciaGreaterThanEqualAndActivoTrueOrderByAnosExperienciaDesc(Integer anosMinimos);
}