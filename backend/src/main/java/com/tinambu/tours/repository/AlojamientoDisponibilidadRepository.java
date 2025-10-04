package com.tinambu.tours.repository;

import com.tinambu.tours.entity.alojamiento.AlojamientoDisponibilidad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface AlojamientoDisponibilidadRepository extends JpaRepository<AlojamientoDisponibilidad, UUID> {

    List<AlojamientoDisponibilidad> findByAlojamientoIdAndActivoTrue(UUID alojamientoId);

    @Query("SELECT ad FROM AlojamientoDisponibilidad ad WHERE ad.alojamientoId = :alojamientoId " +
           "AND ad.activo = true AND ad.fechaInicio <= :checkOut AND ad.fechaFin >= :checkIn")
    List<AlojamientoDisponibilidad> findByAlojamientoIdAndRangoFechas(@Param("alojamientoId") UUID alojamientoId,
                                                                     @Param("checkIn") LocalDate checkIn,
                                                                     @Param("checkOut") LocalDate checkOut);

    @Query("SELECT CASE WHEN COUNT(ad) > 0 THEN true ELSE false END " +
           "FROM AlojamientoDisponibilidad ad WHERE ad.alojamientoId = :alojamientoId " +
           "AND ad.activo = true AND ad.fechaInicio <= :checkIn AND ad.fechaFin >= :checkOut")
    boolean existeDisponibilidadParaRango(@Param("alojamientoId") UUID alojamientoId,
                                         @Param("checkIn") LocalDate checkIn,
                                         @Param("checkOut") LocalDate checkOut);

    @Query("SELECT ad FROM AlojamientoDisponibilidad ad WHERE ad.alojamientoId = :alojamientoId " +
           "AND ad.activo = true AND " +
           "((ad.fechaInicio BETWEEN :fechaInicio AND :fechaFin) OR " +
           "(ad.fechaFin BETWEEN :fechaInicio AND :fechaFin) OR " +
           "(ad.fechaInicio <= :fechaInicio AND ad.fechaFin >= :fechaFin))")
    List<AlojamientoDisponibilidad> findSolapamientos(@Param("alojamientoId") UUID alojamientoId,
                                                     @Param("fechaInicio") LocalDate fechaInicio,
                                                     @Param("fechaFin") LocalDate fechaFin);

    @Query("SELECT ad FROM AlojamientoDisponibilidad ad WHERE ad.alojamientoId = :alojamientoId " +
           "AND ad.activo = true ORDER BY ad.fechaInicio")
    List<AlojamientoDisponibilidad> findByAlojamientoIdOrdenadoPorFecha(@Param("alojamientoId") UUID alojamientoId);

    @Query("SELECT ad FROM AlojamientoDisponibilidad ad WHERE ad.activo = true " +
           "AND ad.fechaFin >= :fechaActual ORDER BY ad.fechaInicio")
    List<AlojamientoDisponibilidad> findDisponibilidadesFuturas(@Param("fechaActual") LocalDate fechaActual);

    @Query("SELECT ad FROM AlojamientoDisponibilidad ad WHERE ad.alojamientoId = :alojamientoId " +
           "AND ad.activo = true AND ad.fechaFin >= :fechaActual " +
           "ORDER BY ad.fechaInicio")
    List<AlojamientoDisponibilidad> findDisponibilidadesFuturasPorAlojamiento(@Param("alojamientoId") UUID alojamientoId,
                                                                             @Param("fechaActual") LocalDate fechaActual);

    Long countByAlojamientoIdAndActivoTrue(UUID alojamientoId);

    @Query("SELECT MIN(ad.fechaInicio) FROM AlojamientoDisponibilidad ad " +
           "WHERE ad.alojamientoId = :alojamientoId AND ad.activo = true AND ad.fechaFin >= :fechaActual")
    LocalDate findPrimeraFechaDisponible(@Param("alojamientoId") UUID alojamientoId,
                                        @Param("fechaActual") LocalDate fechaActual);

    @Query("SELECT MAX(ad.fechaFin) FROM AlojamientoDisponibilidad ad " +
           "WHERE ad.alojamientoId = :alojamientoId AND ad.activo = true")
    LocalDate findUltimaFechaDisponible(@Param("alojamientoId") UUID alojamientoId);
}
