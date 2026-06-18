package com.tinambu.tours.repository;

import com.tinambu.tours.entity.reserva.AlojamientoReserva;
import com.tinambu.tours.entity.reserva.EstadoReserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AlojamientoReservaRepository extends JpaRepository<AlojamientoReserva, UUID> {

    List<AlojamientoReserva> findByAlojamientoIdAndEstado(UUID alojamientoId, EstadoReserva estado);

    /** Resolve an accommodation reservation from a PlacetoPay session id (used by the notification webhook). */
    Optional<AlojamientoReserva> findByPlacetoPayRequestId(Long requestId);

    List<AlojamientoReserva> findByFechaCheckInBetween(LocalDate fechaInicio, LocalDate fechaFin);

    List<AlojamientoReserva> findByFechaCheckOutBetween(LocalDate fechaInicio, LocalDate fechaFin);

    @Query("SELECT ar FROM AlojamientoReserva ar WHERE ar.alojamientoId = :alojamientoId " +
           "AND ((ar.fechaCheckIn BETWEEN :checkIn AND :checkOut) OR " +
           "(ar.fechaCheckOut BETWEEN :checkIn AND :checkOut) OR " +
           "(ar.fechaCheckIn <= :checkIn AND ar.fechaCheckOut >= :checkOut)) " +
           "AND ar.estado IN ('CONFIRMADA', 'PENDIENTE')")
    List<AlojamientoReserva> findReservasSuperpuestas(@Param("alojamientoId") UUID alojamientoId,
                                                     @Param("checkIn") LocalDate checkIn,
                                                     @Param("checkOut") LocalDate checkOut);

    @Query("SELECT CASE WHEN COUNT(ar) > 0 THEN true ELSE false END " +
           "FROM AlojamientoReserva ar WHERE ar.alojamientoId = :alojamientoId " +
           "AND ((ar.fechaCheckIn < :checkOut AND ar.fechaCheckOut > :checkIn)) " +
           "AND ar.estado IN ('CONFIRMADA', 'PENDIENTE')")
    boolean existeReservaEnRango(@Param("alojamientoId") UUID alojamientoId,
                                @Param("checkIn") LocalDate checkIn,
                                @Param("checkOut") LocalDate checkOut);

    @Query("SELECT ar FROM AlojamientoReserva ar WHERE ar.fechaCheckIn = :fecha " +
           "AND ar.estado IN ('CONFIRMADA', 'PENDIENTE') ORDER BY ar.fechaCreacion")
    List<AlojamientoReserva> findCheckInsDelDia(@Param("fecha") LocalDate fecha);

    @Query("SELECT ar FROM AlojamientoReserva ar WHERE ar.fechaCheckOut = :fecha " +
           "AND ar.estado IN ('CONFIRMADA', 'PENDIENTE') ORDER BY ar.fechaCreacion")
    List<AlojamientoReserva> findCheckOutsDelDia(@Param("fecha") LocalDate fecha);

    @Query("SELECT ar FROM AlojamientoReserva ar WHERE ar.alojamientoId = :alojamientoId " +
           "ORDER BY ar.fechaCheckIn DESC")
    List<AlojamientoReserva> findByAlojamientoIdOrdenadoPorFecha(@Param("alojamientoId") UUID alojamientoId);

    Long countByAlojamientoId(UUID alojamientoId);

    @Query("SELECT COUNT(ar) FROM AlojamientoReserva ar WHERE ar.alojamientoId = :alojamientoId " +
           "AND ar.estado IN ('CONFIRMADA', 'PENDIENTE')")
    Long countReservasActivas(@Param("alojamientoId") UUID alojamientoId);

    @Query("SELECT ar FROM AlojamientoReserva ar WHERE ar.fechaCheckIn BETWEEN :fechaInicio AND :fechaFin " +
           "AND ar.estado IN ('CONFIRMADA', 'PENDIENTE') ORDER BY ar.fechaCheckIn")
    List<AlojamientoReserva> findReservasEnPeriodo(@Param("fechaInicio") LocalDate fechaInicio,
                                                  @Param("fechaFin") LocalDate fechaFin);

    @Query("SELECT AVG(ar.numeroNoches) FROM AlojamientoReserva ar WHERE ar.alojamientoId = :alojamientoId " +
           "AND ar.estado = 'CONFIRMADA'")
    Double getPromedioNochesPorAlojamiento(@Param("alojamientoId") UUID alojamientoId);

    @Query("SELECT ar FROM AlojamientoReserva ar WHERE ar.estado IN ('CONFIRMADA', 'PENDIENTE') " +
           "AND ar.fechaCheckIn <= :fechaActual AND ar.fechaCheckOut > :fechaActual")
    List<AlojamientoReserva> findReservasActivas(@Param("fechaActual") LocalDate fechaActual);

    @Query("SELECT ar.alojamientoId, COUNT(ar) as total FROM AlojamientoReserva ar " +
           "WHERE ar.estado = 'CONFIRMADA' GROUP BY ar.alojamientoId ORDER BY total DESC")
    List<Object[]> findAlojamientosMasReservados();

    /**
     * Alojamiento reservations created via Prex transfer that are still PENDING and unpaid,
     * created BEFORE the given threshold. Used by the auto-cancel flow to release blocked
     * dates after the 12-hour transfer window expires.
     */
    @Query("SELECT ar FROM AlojamientoReserva ar " +
           "WHERE ar.metodoPago = 'PREX' " +
           "AND ar.estado = com.tinambu.tours.entity.reserva.EstadoReserva.PENDIENTE " +
           "AND (ar.estadoPago = com.tinambu.tours.entity.reserva.EstadoPago.PENDIENTE OR ar.estadoPago IS NULL) " +
           "AND ar.placetoPayRequestId IS NULL " +
           "AND ar.fechaCreacion < :threshold")
    List<AlojamientoReserva> findExpiredPrexPending(@Param("threshold") LocalDateTime threshold);
}
