package com.tinambu.tours.repository;

import com.tinambu.tours.entity.guia.GuiaReservaBloqueo;
import com.tinambu.tours.entity.sendero.TurnoSendero;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface GuiaReservaBloqueoRepository extends JpaRepository<GuiaReservaBloqueo, UUID> {

    // Find all active blocks for a guide on specific date and shift
    List<GuiaReservaBloqueo> findByGuiaIdAndFechaAndTurnoAndActivoTrue(UUID guiaId, LocalDate fecha, TurnoSendero turno);

    // Find all active blocks for a guide on specific date (any shift)
    List<GuiaReservaBloqueo> findByGuiaIdAndFechaAndActivoTrue(UUID guiaId, LocalDate fecha);

    // Check if guide is blocked on specific date and shift
    @Query("SELECT COUNT(grb) > 0 FROM GuiaReservaBloqueo grb WHERE grb.guiaId = :guiaId " +
           "AND grb.fecha = :fecha AND grb.turno = :turno AND grb.activo = true")
    boolean isGuiaBlocked(@Param("guiaId") UUID guiaId, 
                         @Param("fecha") LocalDate fecha, 
                         @Param("turno") TurnoSendero turno);

    // Get all blocked guide IDs for specific date and shift
    @Query("SELECT DISTINCT grb.guiaId FROM GuiaReservaBloqueo grb WHERE grb.fecha = :fecha " +
           "AND grb.turno = :turno AND grb.activo = true")
    List<UUID> findBlockedGuiaIds(@Param("fecha") LocalDate fecha, 
                                 @Param("turno") TurnoSendero turno);

    // Find all blocks for a reservation (for cleanup on cancellation)
    List<GuiaReservaBloqueo> findByReservaIdAndActivoTrue(UUID reservaId);

    // Deactivate all blocks for a reservation (when cancelled)
    @Modifying
    @Query("UPDATE GuiaReservaBloqueo grb SET grb.activo = false WHERE grb.reservaId = :reservaId")
    void deactivateBlocksForReservation(@Param("reservaId") UUID reservaId);

    // Find all active blocks for a guide in date range
    @Query("SELECT grb FROM GuiaReservaBloqueo grb WHERE grb.guiaId = :guiaId " +
           "AND grb.activo = true AND grb.fecha BETWEEN :fechaDesde AND :fechaHasta " +
           "ORDER BY grb.fecha ASC, grb.turno ASC")
    List<GuiaReservaBloqueo> findByGuiaIdInDateRange(@Param("guiaId") UUID guiaId,
                                                    @Param("fechaDesde") LocalDate fechaDesde,
                                                    @Param("fechaHasta") LocalDate fechaHasta);

    // Find blocks created for specific sendero (by name)
    List<GuiaReservaBloqueo> findBySenderoReservadoContainingIgnoreCaseAndActivoTrue(String senderoName);

    // Get all active blocks for date range and shift (for availability checking)
    @Query("SELECT grb FROM GuiaReservaBloqueo grb WHERE grb.activo = true " +
           "AND grb.fecha BETWEEN :fechaDesde AND :fechaHasta " +
           "AND (:turno IS NULL OR grb.turno = :turno) " +
           "ORDER BY grb.fecha ASC, grb.guiaId ASC")
    List<GuiaReservaBloqueo> findActiveBlocksInDateRange(@Param("fechaDesde") LocalDate fechaDesde,
                                                        @Param("fechaHasta") LocalDate fechaHasta,
                                                        @Param("turno") TurnoSendero turno);

    // Clean up old inactive blocks (for maintenance)
    @Modifying
    @Query("DELETE FROM GuiaReservaBloqueo grb WHERE grb.activo = false AND grb.fecha < :cutoffDate")
    void deleteInactiveBlocksBeforeDate(@Param("cutoffDate") LocalDate cutoffDate);

    // Count active blocks for a guide
    @Query("SELECT COUNT(grb) FROM GuiaReservaBloqueo grb WHERE grb.guiaId = :guiaId AND grb.activo = true")
    long countActiveBlocksForGuia(@Param("guiaId") UUID guiaId);

    // Find next block for a guide (upcoming)
    @Query("SELECT grb FROM GuiaReservaBloqueo grb WHERE grb.guiaId = :guiaId AND grb.activo = true " +
           "AND grb.fecha >= CURRENT_DATE ORDER BY grb.fecha ASC, grb.turno ASC LIMIT 1")
    GuiaReservaBloqueo findNextBlockForGuia(@Param("guiaId") UUID guiaId);

    // Statistics: Count blocks by sendero name
    @Query("SELECT grb.senderoReservado, COUNT(grb) FROM GuiaReservaBloqueo grb " +
           "WHERE grb.activo = true GROUP BY grb.senderoReservado ORDER BY COUNT(grb) DESC")
    List<Object[]> getBlockStatsBySendero();
}
