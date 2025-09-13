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

    // Find all active availabilities for a sendero
    List<SenderoDisponibilidad> findBySenderoIdAndActivoTrueOrderByFechaInicioAsc(UUID senderoId);

    // Find availabilities that include a specific date
    @Query("SELECT sd FROM SenderoDisponibilidad sd WHERE sd.senderoId = :senderoId " +
           "AND sd.activo = true AND :fecha BETWEEN sd.fechaInicio AND sd.fechaFin")
    List<SenderoDisponibilidad> findBySenderoIdAndDateInRange(@Param("senderoId") UUID senderoId, 
                                                            @Param("fecha") LocalDate fecha);

    // Find availabilities for specific date and shift
    @Query("SELECT sd FROM SenderoDisponibilidad sd WHERE sd.senderoId = :senderoId " +
           "AND sd.activo = true AND :fecha BETWEEN sd.fechaInicio AND sd.fechaFin " +
           "AND ((:turno = 'MANANA' AND sd.turnoManana = true) OR (:turno = 'TARDE' AND sd.turnoTarde = true))")
    List<SenderoDisponibilidad> findBySenderoIdAndDateAndShift(@Param("senderoId") UUID senderoId,
                                                              @Param("fecha") LocalDate fecha,
                                                              @Param("turno") String turno);

    // Find overlapping availabilities for validation
    @Query("SELECT sd FROM SenderoDisponibilidad sd WHERE sd.senderoId = :senderoId " +
           "AND sd.activo = true AND sd.id != :excludeId " +
           "AND NOT (sd.fechaFin < :fechaInicio OR sd.fechaInicio > :fechaFin)")
    List<SenderoDisponibilidad> findOverlappingAvailabilities(@Param("senderoId") UUID senderoId,
                                                              @Param("fechaInicio") LocalDate fechaInicio,
                                                              @Param("fechaFin") LocalDate fechaFin,
                                                              @Param("excludeId") UUID excludeId);

    // Find availabilities in a date range
    @Query("SELECT sd FROM SenderoDisponibilidad sd WHERE sd.senderoId = :senderoId " +
           "AND sd.activo = true " +
           "AND NOT (sd.fechaFin < :fechaDesde OR sd.fechaInicio > :fechaHasta) " +
           "ORDER BY sd.fechaInicio ASC")
    List<SenderoDisponibilidad> findBySenderoIdInDateRange(@Param("senderoId") UUID senderoId,
                                                           @Param("fechaDesde") LocalDate fechaDesde,
                                                           @Param("fechaHasta") LocalDate fechaHasta);

    // Check if sendero is available on specific date and shift
    @Query("SELECT COUNT(sd) > 0 FROM SenderoDisponibilidad sd WHERE sd.senderoId = :senderoId " +
           "AND sd.activo = true AND :fecha BETWEEN sd.fechaInicio AND sd.fechaFin " +
           "AND ((:turno = 'MANANA' AND sd.turnoManana = true) OR (:turno = 'TARDE' AND sd.turnoTarde = true))")
    boolean isSenderoAvailableOnDateAndShift(@Param("senderoId") UUID senderoId,
                                           @Param("fecha") LocalDate fecha,
                                           @Param("turno") String turno);

    // Find all sendero IDs that are available on a specific date and shift
    @Query("SELECT DISTINCT sd.senderoId FROM SenderoDisponibilidad sd WHERE sd.activo = true " +
           "AND :fecha BETWEEN sd.fechaInicio AND sd.fechaFin " +
           "AND ((:turno = 'MANANA' AND sd.turnoManana = true) OR (:turno = 'TARDE' AND sd.turnoTarde = true))")
    List<UUID> findSenderoIdsAvailableOnDateAndShift(@Param("fecha") LocalDate fecha,
                                                     @Param("turno") String turno);

    // Delete all availabilities for a sendero
    void deleteBySenderoId(UUID senderoId);
}
