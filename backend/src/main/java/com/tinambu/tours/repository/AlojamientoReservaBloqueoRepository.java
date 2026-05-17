package com.tinambu.tours.repository;

import com.tinambu.tours.entity.alojamiento.AlojamientoReservaBloqueo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AlojamientoReservaBloqueoRepository extends JpaRepository<AlojamientoReservaBloqueo, UUID> {

    String BLOQUEO_VIGENTE =
            "(arb.activo = true AND ( "
                    + "(arb.carritoUsuarioId IS NULL AND arb.carritoExpiraEn IS NULL) "
                    + "OR (arb.carritoExpiraEn IS NOT NULL AND arb.carritoExpiraEn > :ahora) "
                    + ")) ";

    @Query("SELECT CASE WHEN COUNT(arb) > 0 THEN true ELSE false END " +
           "FROM AlojamientoReservaBloqueo arb WHERE arb.alojamientoId = :alojamientoId " +
           "AND arb.fecha = :fecha AND " + BLOQUEO_VIGENTE)
    boolean existeBloqueoParaFecha(@Param("alojamientoId") UUID alojamientoId,
                                  @Param("fecha") LocalDate fecha,
                                  @Param("ahora") LocalDateTime ahora);

    List<AlojamientoReservaBloqueo> findByReservaIdAndActivoTrue(UUID reservaId);

    @Query("SELECT arb FROM AlojamientoReservaBloqueo arb WHERE arb.alojamientoId = :alojamientoId " +
           "AND arb.fecha BETWEEN :fechaInicio AND :fechaFin AND " + BLOQUEO_VIGENTE)
    List<AlojamientoReservaBloqueo> findBloqueosEnRango(@Param("alojamientoId") UUID alojamientoId,
                                                       @Param("fechaInicio") LocalDate fechaInicio,
                                                       @Param("fechaFin") LocalDate fechaFin,
                                                       @Param("ahora") LocalDateTime ahora);

    @Query("SELECT CASE WHEN COUNT(arb) > 0 THEN true ELSE false END " +
           "FROM AlojamientoReservaBloqueo arb WHERE arb.alojamientoId = :alojamientoId " +
           "AND arb.fecha >= :checkIn AND arb.fecha < :checkOut AND " + BLOQUEO_VIGENTE +
           "AND (:excluirCarritoUsuario IS NULL OR arb.carritoUsuarioId IS NULL OR arb.carritoUsuarioId <> :excluirCarritoUsuario)")
    boolean tieneBloqueoEnRango(@Param("alojamientoId") UUID alojamientoId,
                               @Param("checkIn") LocalDate checkIn,
                               @Param("checkOut") LocalDate checkOut,
                               @Param("excluirCarritoUsuario") UUID excluirCarritoUsuario,
                               @Param("ahora") LocalDateTime ahora);

    @Modifying
    @Query("UPDATE AlojamientoReservaBloqueo arb SET arb.activo = false WHERE arb.reservaId = :reservaId")
    void desactivarBloqueosPorReserva(@Param("reservaId") UUID reservaId);

    @Query("SELECT arb.fecha FROM AlojamientoReservaBloqueo arb WHERE arb.alojamientoId = :alojamientoId " +
           "AND arb.fecha >= :fechaInicio AND arb.fecha <= :fechaFin AND " + BLOQUEO_VIGENTE +
           "AND (:excluirCarritoUsuario IS NULL OR arb.carritoUsuarioId IS NULL OR arb.carritoUsuarioId <> :excluirCarritoUsuario) " +
           "ORDER BY arb.fecha")
    List<LocalDate> findFechasBloqueadasEnRango(@Param("alojamientoId") UUID alojamientoId,
                                               @Param("fechaInicio") LocalDate fechaInicio,
                                               @Param("fechaFin") LocalDate fechaFin,
                                               @Param("excluirCarritoUsuario") UUID excluirCarritoUsuario,
                                               @Param("ahora") LocalDateTime ahora);

    Long countByAlojamientoIdAndActivoTrue(UUID alojamientoId);

    @Query("SELECT arb FROM AlojamientoReservaBloqueo arb WHERE arb.alojamientoId = :alojamientoId " +
           "AND arb.activo = true ORDER BY arb.fecha")
    List<AlojamientoReservaBloqueo> findBloqueosActivosPorAlojamiento(@Param("alojamientoId") UUID alojamientoId);

    @Query("SELECT DISTINCT arb.alojamientoId FROM AlojamientoReservaBloqueo arb " +
           "WHERE arb.fecha = :fecha AND arb.activo = true AND ( "
           + "(arb.carritoUsuarioId IS NULL AND arb.carritoExpiraEn IS NULL) "
           + "OR (arb.carritoExpiraEn IS NOT NULL AND arb.carritoExpiraEn > :ahora) "
           + ")")
    List<UUID> findAlojamientosBloqueadosEnFecha(@Param("fecha") LocalDate fecha,
                                                @Param("ahora") LocalDateTime ahora);

    @Modifying
    @Query("DELETE FROM AlojamientoReservaBloqueo arb WHERE arb.reservaId = :reservaId")
    void deleteByReservaId(@Param("reservaId") UUID reservaId);

    @Query("SELECT arb FROM AlojamientoReservaBloqueo arb WHERE arb.alojamientoId = :alojamientoId " +
           "AND arb.reservaId IS NULL AND arb.carritoUsuarioId IS NULL AND arb.activo = true ORDER BY arb.fecha")
    List<AlojamientoReservaBloqueo> findBloqueosManuals(@Param("alojamientoId") UUID alojamientoId);

    @Modifying
    @Transactional
    @Query("UPDATE AlojamientoReservaBloqueo arb SET arb.activo = false " +
           "WHERE arb.alojamientoId = :alojamientoId AND arb.reservaId IS NULL AND arb.carritoUsuarioId IS NULL " +
           "AND arb.fecha BETWEEN :fechaInicio AND :fechaFin")
    void desactivarBloqueosManualEnRango(@Param("alojamientoId") UUID alojamientoId,
                                         @Param("fechaInicio") LocalDate fechaInicio,
                                         @Param("fechaFin") LocalDate fechaFin);

    @Query("SELECT COUNT(DISTINCT arb.fecha) FROM AlojamientoReservaBloqueo arb " +
           "WHERE arb.alojamientoId = :alojamientoId AND " + BLOQUEO_VIGENTE +
           "AND arb.fecha BETWEEN :fechaInicio AND :fechaFin")
    Long countFechasBloqueadasEnRango(@Param("alojamientoId") UUID alojamientoId,
                                     @Param("fechaInicio") LocalDate fechaInicio,
                                     @Param("fechaFin") LocalDate fechaFin,
                                     @Param("ahora") LocalDateTime ahora);

    @Modifying
    @Transactional
    @Query("UPDATE AlojamientoReservaBloqueo b SET b.activo = false WHERE b.carritoUsuarioId IS NOT NULL " +
           "AND b.carritoExpiraEn IS NOT NULL AND b.carritoExpiraEn < :ahora AND b.activo = true")
    int desactivarBloqueosCarritoExpirados(@Param("ahora") LocalDateTime ahora);

    @Modifying
    @Transactional
    @Query("UPDATE AlojamientoReservaBloqueo b SET b.activo = false WHERE b.alojamientoId = :alojId " +
           "AND b.carritoUsuarioId = :usuarioId AND b.carritoExpiraEn IS NOT NULL AND b.activo = true")
    int desactivarBloqueosCarritoDeUsuarioParaAlojamiento(@Param("alojId") UUID alojId,
                                                          @Param("usuarioId") UUID usuarioId);

    @Modifying
    @Transactional
    @Query("UPDATE AlojamientoReservaBloqueo b SET b.activo = false WHERE b.carritoUsuarioId = :usuarioId " +
           "AND b.carritoExpiraEn IS NOT NULL AND b.activo = true")
    int desactivarTodosBloqueosCarritoDeUsuario(@Param("usuarioId") UUID usuarioId);

    @Modifying
    @Transactional
    @Query("UPDATE AlojamientoReservaBloqueo b SET b.activo = false WHERE b.alojamientoId = :alojId " +
           "AND b.carritoUsuarioId = :usuarioId AND b.carritoExpiraEn IS NOT NULL " +
           "AND b.fecha >= :checkIn AND b.fecha < :checkOut AND b.activo = true")
    int desactivarBloqueosCarritoUsuarioEnRango(@Param("alojId") UUID alojId,
                                               @Param("usuarioId") UUID usuarioId,
                                               @Param("checkIn") LocalDate checkIn,
                                               @Param("checkOut") LocalDate checkOut);
}
