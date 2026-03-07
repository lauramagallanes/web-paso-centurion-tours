package com.tinambu.tours.repository;

import com.tinambu.tours.entity.sendero.SenderoDisponibilidad;
import com.tinambu.tours.entity.sendero.TurnoSendero;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface SenderoDisponibilidadRepository extends JpaRepository<SenderoDisponibilidad, UUID> {

    // All active availability windows for a sendero
    List<SenderoDisponibilidad> findBySenderoIdAndActivoTrueOrderByFechaInicioAsc(UUID senderoId);

    /**
     * Returns availability windows for a sendero that cover the given date and match the given turno.
     * Day-of-week filtering is done in Java because SQL can't trivially parse the CSV column.
     */
    @Query("SELECT sd FROM SenderoDisponibilidad sd " +
           "WHERE sd.senderoId = :senderoId " +
           "AND sd.activo = true " +
           "AND :fecha BETWEEN sd.fechaInicio AND sd.fechaFin " +
           "AND sd.turno = :turno")
    List<SenderoDisponibilidad> findVentanasActivas(
            @Param("senderoId") UUID senderoId,
            @Param("fecha")     LocalDate fecha,
            @Param("turno")     TurnoSendero turno);

    /**
     * Returns sendero IDs (excluding the given one) that have active availability
     * on the requested date + turno.  Used to suggest alternatives.
     */
    @Query("SELECT DISTINCT sd.senderoId FROM SenderoDisponibilidad sd " +
           "WHERE sd.activo = true " +
           "AND :fecha BETWEEN sd.fechaInicio AND sd.fechaFin " +
           "AND sd.turno = :turno " +
           "AND sd.senderoId <> :excluirId")
    List<UUID> findOtrosSenderoIdsConVentana(
            @Param("excluirId") UUID excluirId,
            @Param("fecha")     LocalDate fecha,
            @Param("turno")     TurnoSendero turno);

    /** Find overlapping windows for a sendero (for admin validation). */
    @Query("SELECT sd FROM SenderoDisponibilidad sd " +
           "WHERE sd.senderoId = :senderoId " +
           "AND sd.activo = true " +
           "AND sd.turno = :turno " +
           "AND sd.id <> :excludeId " +
           "AND NOT (sd.fechaFin < :fechaInicio OR sd.fechaInicio > :fechaFin)")
    List<SenderoDisponibilidad> findOverlappingAvailabilities(
            @Param("senderoId")   UUID senderoId,
            @Param("turno")       TurnoSendero turno,
            @Param("fechaInicio") LocalDate fechaInicio,
            @Param("fechaFin")    LocalDate fechaFin,
            @Param("excludeId")   UUID excludeId);

    // Delete all availabilities for a sendero (admin/cascade use)
    void deleteBySenderoId(UUID senderoId);
}
