package com.tinambu.tours.repository;

import com.tinambu.tours.entity.reserva.AlojamientoReserva;
import com.tinambu.tours.entity.reserva.EstadoReserva;
import com.tinambu.tours.entity.habitacion.Habitacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface AlojamientoReservaRepository extends JpaRepository<AlojamientoReserva, UUID> {

    /**
     * Buscar reservas de alojamiento por habitación
     */
    List<AlojamientoReserva> findByHabitacionOrderByFechaInicioDesc(Habitacion habitacion);

    /**
     * Buscar reservas de alojamiento activas por habitación
     */
    @Query("SELECT ar FROM AlojamientoReserva ar WHERE ar.habitacion = :habitacion AND ar.estado IN ('PENDIENTE', 'CONFIRMADA') ORDER BY ar.fechaInicio")
    List<AlojamientoReserva> findReservasActivasByHabitacion(@Param("habitacion") Habitacion habitacion);

    /**
     * Buscar reservas que bloquean una habitación en un rango de fechas
     */
    @Query("""
        SELECT ar FROM AlojamientoReserva ar 
        WHERE ar.habitacion.id = :habitacionId 
        AND ar.estado IN ('PENDIENTE', 'CONFIRMADA')
        AND NOT (ar.fechaFin < :fechaInicio OR ar.fechaInicio > :fechaFin)
        ORDER BY ar.fechaInicio
    """)
    List<AlojamientoReserva> findReservasQueBloquean(
        @Param("habitacionId") UUID habitacionId,
        @Param("fechaInicio") LocalDate fechaInicio,
        @Param("fechaFin") LocalDate fechaFin
    );

    /**
     * Verificar conflictos de reserva para una habitación
     */
    @Query("""
        SELECT CASE WHEN COUNT(ar) > 0 THEN true ELSE false END
        FROM AlojamientoReserva ar 
        WHERE ar.habitacion.id = :habitacionId 
        AND ar.estado IN ('PENDIENTE', 'CONFIRMADA')
        AND NOT (ar.fechaFin < :fechaInicio OR ar.fechaInicio > :fechaFin)
        AND (:reservaId IS NULL OR ar.id != :reservaId)
    """)
    boolean existeConflictoReserva(
        @Param("habitacionId") UUID habitacionId,
        @Param("fechaInicio") LocalDate fechaInicio,
        @Param("fechaFin") LocalDate fechaFin,
        @Param("reservaId") UUID reservaId
    );

    /**
     * Obtener ocupación de habitaciones por período
     */
    @Query("""
        SELECT h.numero, h.nombre, 
               COUNT(ar) as totalReservas,
               SUM(ar.numeroNoches) as totalNoches,
               AVG(ar.numeroPersonas) as promedioPersonas
        FROM Habitacion h 
        LEFT JOIN AlojamientoReserva ar ON h.id = ar.habitacion.id 
        AND ar.fechaInicio >= :fechaInicio 
        AND ar.fechaFin <= :fechaFin
        AND ar.estado IN ('CONFIRMADA', 'COMPLETADA')
        WHERE h.activa = true
        GROUP BY h.id, h.numero, h.nombre
        ORDER BY totalReservas DESC
    """)
    List<Object[]> findOcupacionHabitacionesPorPeriodo(
        @Param("fechaInicio") LocalDate fechaInicio,
        @Param("fechaFin") LocalDate fechaFin
    );

    /**
     * Buscar reservas de alojamiento por número de personas
     */
    @Query("SELECT ar FROM AlojamientoReserva ar WHERE ar.numeroPersonas = :numeroPersonas ORDER BY ar.fechaCreacion DESC")
    List<AlojamientoReserva> findByNumeroPersonas(@Param("numeroPersonas") Integer numeroPersonas);

    /**
     * Buscar reservas de alojamiento por número de noches
     */
    @Query("SELECT ar FROM AlojamientoReserva ar WHERE ar.numeroNoches = :numeroNoches ORDER BY ar.fechaCreacion DESC")
    List<AlojamientoReserva> findByNumeroNoches(@Param("numeroNoches") Integer numeroNoches);

    /**
     * Calcular ingresos por habitación en un período
     */
    @Query("""
        SELECT h.numero, h.nombre, 
               COALESCE(SUM(ar.precioTotal), 0) as ingresoTotal,
               COUNT(ar) as numeroReservas
        FROM Habitacion h 
        LEFT JOIN AlojamientoReserva ar ON h.id = ar.habitacion.id 
        AND ar.fechaInicio >= :fechaInicio 
        AND ar.fechaFin <= :fechaFin
        AND ar.estado IN ('CONFIRMADA', 'COMPLETADA')
        WHERE h.activa = true
        GROUP BY h.id, h.numero, h.nombre
        ORDER BY ingresoTotal DESC
    """)
    List<Object[]> findIngresosPorHabitacion(
        @Param("fechaInicio") LocalDate fechaInicio,
        @Param("fechaFin") LocalDate fechaFin
    );

    /**
     * Buscar próximas llegadas (check-ins)
     */
    @Query("""
        SELECT ar FROM AlojamientoReserva ar 
        WHERE ar.fechaInicio BETWEEN :fechaInicio AND :fechaFin 
        AND ar.estado = 'CONFIRMADA'
        ORDER BY ar.fechaInicio, ar.habitacion.numero
    """)
    List<AlojamientoReserva> findProximasLlegadas(
        @Param("fechaInicio") LocalDate fechaInicio,
        @Param("fechaFin") LocalDate fechaFin
    );

    /**
     * Buscar próximas salidas (check-outs)
     */
    @Query("""
        SELECT ar FROM AlojamientoReserva ar 
        WHERE ar.fechaFin BETWEEN :fechaInicio AND :fechaFin 
        AND ar.estado = 'CONFIRMADA'
        ORDER BY ar.fechaFin, ar.habitacion.numero
    """)
    List<AlojamientoReserva> findProximasSalidas(
        @Param("fechaInicio") LocalDate fechaInicio,
        @Param("fechaFin") LocalDate fechaFin
    );
}
