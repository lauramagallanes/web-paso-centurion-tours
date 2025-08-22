package com.tinambu.tours.repository;

import com.tinambu.tours.entity.habitacion.Habitacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HabitacionRepository extends JpaRepository<Habitacion, UUID> {

    /**
     * Buscar habitaciones activas
     */
    List<Habitacion> findByActivaTrueOrderByNumero();

    /**
     * Buscar por número de habitación
     */
    Optional<Habitacion> findByNumeroAndActivaTrue(String numero);

    /**
     * Buscar habitaciones por capacidad - SIMPLIFICADO
     */
    List<Habitacion> findByCapacidadMinimaLessThanEqualAndCapacidadMaximaGreaterThanEqualAndActivaTrue(
        Integer numeroPersonas1, Integer numeroPersonas2);

    /**
     * Buscar por rango de precio - SIMPLIFICADO
     */
    List<Habitacion> findByPrecioPorPersonaNocheBetweenAndActivaTrueOrderByPrecioPorPersonaNoche(
        BigDecimal precioMin, BigDecimal precioMax);
}