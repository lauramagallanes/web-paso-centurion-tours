package com.tinambu.tours.repository;

import com.tinambu.tours.entity.reserva.SenderoReserva;
import com.tinambu.tours.entity.reserva.TurnoSendero;
import com.tinambu.tours.entity.sendero.Sendero;
import com.tinambu.tours.entity.guia.Guia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface SenderoReservaRepository extends JpaRepository<SenderoReserva, UUID> {

    /**
     * Buscar reservas de sendero por sendero
     */
    List<SenderoReserva> findBySenderoOrderByFechaInicioDesc(Sendero sendero);

    /**
     * Buscar reservas de sendero por guía
     */
    List<SenderoReserva> findByGuiaOrderByFechaInicioDesc(Guia guia);

    /**
     * Buscar reservas de sendero por turno
     */
    List<SenderoReserva> findByTurnoOrderByFechaInicioDesc(TurnoSendero turno);

    /**
     * Buscar reservas activas de sendero por guía y turno en una fecha específica
     */
    @Query("""
        SELECT sr FROM SenderoReserva sr 
        WHERE sr.guia.id = :guiaId 
        AND sr.turno = :turno
        AND sr.estado IN ('PENDIENTE', 'CONFIRMADA')
        AND sr.fechaInicio <= :fecha 
        AND sr.fechaFin >= :fecha
        ORDER BY sr.fechaInicio
    """)
    List<SenderoReserva> findReservasActivasByGuiaYTurnoEnFecha(
        @Param("guiaId") UUID guiaId,
        @Param("turno") TurnoSendero turno,
        @Param("fecha") LocalDate fecha
    );

    /**
     * Buscar reservas que comparten sendero, guía y turno en una fecha (para verificar capacidad)
     */
    @Query("""
        SELECT sr FROM SenderoReserva sr 
        WHERE sr.sendero.id = :senderoId 
        AND sr.guia.id = :guiaId
        AND sr.turno = :turno
        AND sr.estado IN ('PENDIENTE', 'CONFIRMADA')
        AND sr.fechaInicio <= :fecha 
        AND sr.fechaFin >= :fecha
        ORDER BY sr.fechaCreacion
    """)
    List<SenderoReserva> findReservasCompartidasEnFecha(
        @Param("senderoId") UUID senderoId,
        @Param("guiaId") UUID guiaId,
        @Param("turno") TurnoSendero turno,
        @Param("fecha") LocalDate fecha
    );

    /**
     * Calcular personas totales en un sendero para una fecha, guía y turno específicos
     */
    @Query("""
        SELECT COALESCE(SUM(sr.numeroPersonas), 0)
        FROM SenderoReserva sr 
        WHERE sr.sendero.id = :senderoId 
        AND sr.guia.id = :guiaId
        AND sr.turno = :turno
        AND sr.estado IN ('PENDIENTE', 'CONFIRMADA')
        AND sr.fechaInicio <= :fecha 
        AND sr.fechaFin >= :fecha
        AND (:reservaId IS NULL OR sr.id != :reservaId)
    """)
    int countPersonasEnSenderoFechaTurno(
        @Param("senderoId") UUID senderoId,
        @Param("guiaId") UUID guiaId,
        @Param("turno") TurnoSendero turno,
        @Param("fecha") LocalDate fecha,
        @Param("reservaId") UUID reservaId
    );

    /**
     * Verificar si un guía está disponible en una fecha y turno
     */
    @Query("""
        SELECT CASE WHEN COUNT(sr) = 0 THEN true ELSE false END
        FROM SenderoReserva sr 
        WHERE sr.guia.id = :guiaId
        AND sr.turno = :turno
        AND sr.estado IN ('PENDIENTE', 'CONFIRMADA')
        AND sr.fechaInicio <= :fecha 
        AND sr.fechaFin >= :fecha
        AND (:reservaId IS NULL OR sr.id != :reservaId)
    """)
    boolean isGuiaDisponibleEnFechaTurno(
        @Param("guiaId") UUID guiaId,
        @Param("turno") TurnoSendero turno,
        @Param("fecha") LocalDate fecha,
        @Param("reservaId") UUID reservaId
    );

    /**
     * Obtener estadísticas de uso de senderos por período
     */
    @Query("""
        SELECT s.nombre, 
               COUNT(sr) as totalReservas,
               SUM(sr.numeroPersonas) as totalPersonas,
               SUM(sr.numeroDias) as totalDias,
               AVG(sr.numeroPersonas) as promedioPersonasPorReserva
        FROM Sendero s 
        LEFT JOIN SenderoReserva sr ON s.id = sr.sendero.id 
        AND sr.fechaInicio >= :fechaInicio 
        AND sr.fechaFin <= :fechaFin
        AND sr.estado IN ('CONFIRMADA', 'COMPLETADA')
        WHERE s.activo = true
        GROUP BY s.id, s.nombre
        ORDER BY totalReservas DESC
    """)
    List<Object[]> findEstadisticasUsoPorSendero(
        @Param("fechaInicio") LocalDate fechaInicio,
        @Param("fechaFin") LocalDate fechaFin
    );

    /**
     * Obtener estadísticas de trabajo de guías por período
     */
    @Query("""
        SELECT g.nombre, g.apellido,
               COUNT(sr) as totalReservas,
               SUM(sr.numeroPersonas) as totalPersonasGuiadas,
               COUNT(CASE WHEN sr.turno = 'MANANA' THEN 1 END) as turnosManana,
               COUNT(CASE WHEN sr.turno = 'TARDE' THEN 1 END) as turnosTarde
        FROM Guia g 
        LEFT JOIN SenderoReserva sr ON g.id = sr.guia.id 
        AND sr.fechaInicio >= :fechaInicio 
        AND sr.fechaFin <= :fechaFin
        AND sr.estado IN ('CONFIRMADA', 'COMPLETADA')
        WHERE g.activo = true
        GROUP BY g.id, g.nombre, g.apellido
        ORDER BY totalReservas DESC
    """)
    List<Object[]> findEstadisticasTrabajoGuias(
        @Param("fechaInicio") LocalDate fechaInicio,
        @Param("fechaFin") LocalDate fechaFin
    );

    /**
     * Buscar próximas actividades de sendero
     */
    @Query("""
        SELECT sr FROM SenderoReserva sr 
        WHERE sr.fechaInicio BETWEEN :fechaInicio AND :fechaFin 
        AND sr.estado = 'CONFIRMADA'
        ORDER BY sr.fechaInicio, sr.turno, sr.guia.nombre
    """)
    List<SenderoReserva> findProximasActividades(
        @Param("fechaInicio") LocalDate fechaInicio,
        @Param("fechaFin") LocalDate fechaFin
    );

    /**
     * Calcular ingresos por sendero en un período
     */
    @Query("""
        SELECT s.nombre, 
               COALESCE(SUM(sr.precioTotal), 0) as ingresoTotal,
               COUNT(sr) as numeroReservas
        FROM Sendero s 
        LEFT JOIN SenderoReserva sr ON s.id = sr.sendero.id 
        AND sr.fechaInicio >= :fechaInicio 
        AND sr.fechaFin <= :fechaFin
        AND sr.estado IN ('CONFIRMADA', 'COMPLETADA')
        WHERE s.activo = true
        GROUP BY s.id, s.nombre
        ORDER BY ingresoTotal DESC
    """)
    List<Object[]> findIngresosPorSendero(
        @Param("fechaInicio") LocalDate fechaInicio,
        @Param("fechaFin") LocalDate fechaFin
    );
}
