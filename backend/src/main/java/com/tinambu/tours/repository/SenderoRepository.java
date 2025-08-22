package com.tinambu.tours.repository;

import com.tinambu.tours.entity.sendero.Sendero;
import com.tinambu.tours.entity.sendero.NivelDificultad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SenderoRepository extends JpaRepository<Sendero, UUID> {

    /**
     * Buscar senderos activos
     */
    List<Sendero> findByActivoTrueOrderByNombre();

    /**
     * Buscar por nombre
     */
    Optional<Sendero> findByNombreAndActivoTrue(String nombre);

    /**
     * Buscar por nivel de dificultad
     */
    List<Sendero> findByNivelDificultadAndActivoTrueOrderByNombre(NivelDificultad nivelDificultad);

    /**
     * Buscar senderos por capacidad mínima - SIMPLIFICADO
     */
    List<Sendero> findByCapacidadMaximaGrupoGreaterThanEqualAndActivoTrueOrderByNombre(Integer numeroPersonas);
}