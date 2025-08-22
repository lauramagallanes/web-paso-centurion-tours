package com.tinambu.tours.repository;

import com.tinambu.tours.entity.habitacion.Habitacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HabitacionRepository extends JpaRepository<Habitacion, UUID> {

    /**
     * Buscar habitación por número
     */
    Optional<Habitacion> findByNumero(String numero);

    /**
     * Verificar si existe una habitación con el número dado
     */
    boolean existsByNumero(String numero);

    /**
     * Buscar habitaciones activas
     */
    List<Habitacion> findByActivaTrue();

    /**
     * Buscar habitaciones que pueden acomodar un número específico de personas
     */
    @Query("SELECT h FROM Habitacion h WHERE h.capacidadMinima <= :numeroPersonas AND h.capacidadMaxima >= :numeroPersonas AND h.activa = true")
    List<Habitacion> findByCapacidadPersonas(@Param("numeroPersonas") Integer numeroPersonas);

    /**
     * Buscar habitaciones disponibles en un rango de fechas
     * Una habitación está disponible si NO tiene reservas confirmadas o pendientes en esas fechas
     */
    @Query("""
        SELECT h FROM Habitacion h 
        WHERE h.activa = true 
        AND h.capacidadMinima <= :numeroPersonas 
        AND h.capacidadMaxima >= :numeroPersonas
        AND h.id NOT IN (
            SELECT ar.habitacion.id FROM AlojamientoReserva ar 
            WHERE ar.estado IN ('PENDIENTE', 'CONFIRMADA')
            AND NOT (ar.fechaFin < :fechaInicio OR ar.fechaInicio > :fechaFin)
        )
        ORDER BY h.numero
    """)
    List<Habitacion> findHabitacionesDisponibles(
        @Param("fechaInicio") LocalDate fechaInicio,
        @Param("fechaFin") LocalDate fechaFin,
        @Param("numeroPersonas") Integer numeroPersonas
    );

    /**
     * Verificar si una habitación específica está disponible en un rango de fechas
     */
    @Query("""
        SELECT CASE WHEN COUNT(ar) = 0 THEN true ELSE false END
        FROM AlojamientoReserva ar 
        WHERE ar.habitacion.id = :habitacionId
        AND ar.estado IN ('PENDIENTE', 'CONFIRMADA')
        AND NOT (ar.fechaFin < :fechaInicio OR ar.fechaInicio > :fechaFin)
    """)
    boolean isHabitacionDisponible(
        @Param("habitacionId") UUID habitacionId,
        @Param("fechaInicio") LocalDate fechaInicio,
        @Param("fechaFin") LocalDate fechaFin
    );

    /**
     * Buscar habitaciones por rango de precios
     */
    @Query("SELECT h FROM Habitacion h WHERE h.precioPorPersonaNoche BETWEEN :precioMin AND :precioMax AND h.activa = true ORDER BY h.precioPorPersonaNoche")
    List<Habitacion> findByRangoPrecio(
        @Param("precioMin") java.math.BigDecimal precioMin,
        @Param("precioMax") java.math.BigDecimal precioMax
    );

    /**
     * Contar habitaciones activas
     */
    long countByActivaTrue();

    /**
     * Buscar habitaciones ordenadas por capacidad
     */
    @Query("SELECT h FROM Habitacion h WHERE h.activa = true ORDER BY h.capacidadMaxima, h.numero")
    List<Habitacion> findAllOrderByCapacidad();
}
