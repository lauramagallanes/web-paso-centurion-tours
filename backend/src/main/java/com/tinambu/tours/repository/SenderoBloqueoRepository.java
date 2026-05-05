package com.tinambu.tours.repository;

import com.tinambu.tours.entity.sendero.SenderoBloqueo;
import com.tinambu.tours.entity.sendero.TurnoSendero;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface SenderoBloqueoRepository extends JpaRepository<SenderoBloqueo, UUID> {

    /** Lista todos los bloqueos de un sendero ordenados por fecha. */
    List<SenderoBloqueo> findBySenderoIdOrderByFechaInicioAsc(UUID senderoId);

    /**
     * Bloqueos activos que cubren la fecha+turno solicitados.
     * Coincide cuando turno IS NULL (bloquea ambos turnos) o turno = :turno.
     */
    @Query("SELECT b FROM SenderoBloqueo b " +
           "WHERE b.senderoId = :senderoId " +
           "AND :fecha BETWEEN b.fechaInicio AND b.fechaFin " +
           "AND (b.turno IS NULL OR b.turno = :turno)")
    List<SenderoBloqueo> findBloqueosQueCubren(
            @Param("senderoId") UUID senderoId,
            @Param("fecha")     LocalDate fecha,
            @Param("turno")     TurnoSendero turno);

    void deleteBySenderoId(UUID senderoId);
}
