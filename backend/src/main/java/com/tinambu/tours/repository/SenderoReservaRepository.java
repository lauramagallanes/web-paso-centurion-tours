package com.tinambu.tours.repository;

import com.tinambu.tours.entity.reserva.SenderoReserva;
import com.tinambu.tours.entity.sendero.TurnoSendero;
import com.tinambu.tours.entity.reserva.EstadoReserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SenderoReservaRepository extends JpaRepository<SenderoReserva, UUID> {

    List<SenderoReserva> findBySendero_Id(UUID senderoId);

    List<SenderoReserva> findByGuia_Id(UUID guiaId);

    @Query("SELECT sr FROM SenderoReserva sr WHERE sr.sendero.id = :senderoId " +
           "AND sr.fechaInicio = :fecha AND sr.turno = :turno " +
           "AND sr.estado IN ('CONFIRMADA', 'PENDIENTE')")
    List<SenderoReserva> findBySenderoAndFechaAndTurno(
        @Param("senderoId") UUID senderoId,
        @Param("fecha") LocalDate fecha,
        @Param("turno") TurnoSendero turno
    );

    @Query("SELECT sr FROM SenderoReserva sr WHERE sr.codigoReserva = :codigo")
    Optional<SenderoReserva> findByCodigoReserva(@Param("codigo") String codigo);

    @Query("SELECT sr FROM SenderoReserva sr WHERE sr.emailContacto = :email ORDER BY sr.fechaCreacion DESC")
    List<SenderoReserva> findByEmailContacto(@Param("email") String email);

    @Query("SELECT sr FROM SenderoReserva sr WHERE sr.estado = :estado ORDER BY sr.fechaCreacion DESC")
    List<SenderoReserva> findByEstado(@Param("estado") EstadoReserva estado);

    @Query("SELECT sr FROM SenderoReserva sr ORDER BY sr.fechaCreacion DESC")
    List<SenderoReserva> findAllOrderByFechaCreacionDesc();

    @Query("SELECT COUNT(sr) FROM SenderoReserva sr WHERE sr.estado = :estado")
    Long countByEstado(@Param("estado") EstadoReserva estado);

    /**
     * Returns the total number of persons already reserved for a specific
     * sendero / date / shift (active reservations only).
     * Used to calculate remaining cupos.
     */
    @Query("SELECT COALESCE(SUM(sr.numeroPersonas), 0) FROM SenderoReserva sr " +
           "WHERE sr.sendero.id = :senderoId " +
           "AND sr.fechaInicio = :fecha " +
           "AND sr.turno = :turno " +
           "AND sr.estado IN ('CONFIRMADA', 'PENDIENTE')")
    int sumPersonasReservadas(
            @Param("senderoId") UUID senderoId,
            @Param("fecha")     LocalDate fecha,
            @Param("turno")     TurnoSendero turno);

    /**
     * Devuelve los IDs de guías que ya están asignados a una reserva activa
     * para el mismo sendero/fecha/turno. Útil para reusar ese guía al sumar
     * un grupo nuevo al mismo tour, en vez de buscar uno libre.
     */
    @Query("SELECT DISTINCT sr.guia.id FROM SenderoReserva sr " +
           "WHERE sr.sendero.id = :senderoId " +
           "AND sr.fechaInicio = :fecha " +
           "AND sr.turno = :turno " +
           "AND sr.estado IN ('CONFIRMADA', 'PENDIENTE') " +
           "AND sr.guia IS NOT NULL")
    List<UUID> findGuiaIdsByReservasActivas(
            @Param("senderoId") UUID senderoId,
            @Param("fecha")     LocalDate fecha,
            @Param("turno")     TurnoSendero turno);
}
