package com.tinambu.tours.repository;

import com.tinambu.tours.entity.alojamiento.AlojamientoReservaBloqueo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface AlojamientoReservaBloqueoRepository extends JpaRepository<AlojamientoReservaBloqueo, UUID> {

    @Query("SELECT CASE WHEN COUNT(arb) > 0 THEN true ELSE false END " +
           "FROM AlojamientoReservaBloqueo arb WHERE arb.alojamientoId = :alojamientoId " +
           "AND arb.fecha = :fecha AND arb.activo = true")
    boolean existeBloqueoParaFecha(@Param("alojamientoId") UUID alojamientoId, 
                                  @Param("fecha") LocalDate fecha);

    List<AlojamientoReservaBloqueo> findByReservaIdAndActivoTrue(UUID reservaId);

    @Query("SELECT arb FROM AlojamientoReservaBloqueo arb WHERE arb.alojamientoId = :alojamientoId " +
           "AND arb.fecha BETWEEN :fechaInicio AND :fechaFin AND arb.activo = true")
    List<AlojamientoReservaBloqueo> findBloqueosEnRango(@Param("alojamientoId") UUID alojamientoId,
                                                       @Param("fechaInicio") LocalDate fechaInicio,
                                                       @Param("fechaFin") LocalDate fechaFin);

    @Query("SELECT CASE WHEN COUNT(arb) > 0 THEN true ELSE false END " +
           "FROM AlojamientoReservaBloqueo arb WHERE arb.alojamientoId = :alojamientoId " +
           "AND arb.fecha >= :checkIn AND arb.fecha < :checkOut AND arb.activo = true")
    boolean tieneBloqueoEnRango(@Param("alojamientoId") UUID alojamientoId,
                               @Param("checkIn") LocalDate checkIn,
                               @Param("checkOut") LocalDate checkOut);

    @Modifying
    @Query("UPDATE AlojamientoReservaBloqueo arb SET arb.activo = false WHERE arb.reservaId = :reservaId")
    void desactivarBloqueosPorReserva(@Param("reservaId") UUID reservaId);

    @Query("SELECT arb.fecha FROM AlojamientoReservaBloqueo arb WHERE arb.alojamientoId = :alojamientoId " +
           "AND arb.activo = true AND arb.fecha >= :fechaInicio AND arb.fecha <= :fechaFin " +
           "ORDER BY arb.fecha")
    List<LocalDate> findFechasBloqueadasEnRango(@Param("alojamientoId") UUID alojamientoId,
                                               @Param("fechaInicio") LocalDate fechaInicio,
                                               @Param("fechaFin") LocalDate fechaFin);

    Long countByAlojamientoIdAndActivoTrue(UUID alojamientoId);

    @Query("SELECT arb FROM AlojamientoReservaBloqueo arb WHERE arb.alojamientoId = :alojamientoId " +
           "AND arb.activo = true ORDER BY arb.fecha")
    List<AlojamientoReservaBloqueo> findBloqueosActivosPorAlojamiento(@Param("alojamientoId") UUID alojamientoId);

    @Query("SELECT DISTINCT arb.alojamientoId FROM AlojamientoReservaBloqueo arb " +
           "WHERE arb.fecha = :fecha AND arb.activo = true")
    List<UUID> findAlojamientosBloqueadosEnFecha(@Param("fecha") LocalDate fecha);

    @Modifying
    @Query("DELETE FROM AlojamientoReservaBloqueo arb WHERE arb.reservaId = :reservaId")
    void deleteByReservaId(@Param("reservaId") UUID reservaId);

    @Query("SELECT COUNT(DISTINCT arb.fecha) FROM AlojamientoReservaBloqueo arb " +
           "WHERE arb.alojamientoId = :alojamientoId AND arb.activo = true " +
           "AND arb.fecha BETWEEN :fechaInicio AND :fechaFin")
    Long countFechasBloqueadasEnRango(@Param("alojamientoId") UUID alojamientoId,
                                     @Param("fechaInicio") LocalDate fechaInicio,
                                     @Param("fechaFin") LocalDate fechaFin);
}
