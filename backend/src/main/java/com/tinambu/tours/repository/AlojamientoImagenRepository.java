package com.tinambu.tours.repository;

import com.tinambu.tours.entity.alojamiento.AlojamientoImagen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AlojamientoImagenRepository extends JpaRepository<AlojamientoImagen, UUID> {

    List<AlojamientoImagen> findByAlojamientoIdOrderByOrden(UUID alojamientoId);

    Optional<AlojamientoImagen> findByAlojamientoIdAndEsPrincipalTrue(UUID alojamientoId);

    List<AlojamientoImagen> findByAlojamientoIdAndEsPrincipalFalseOrderByOrden(UUID alojamientoId);

    Long countByAlojamientoId(UUID alojamientoId);

    @Query("SELECT MAX(ai.orden) FROM AlojamientoImagen ai WHERE ai.alojamientoId = :alojamientoId")
    Optional<Integer> findMaxOrdenByAlojamientoId(@Param("alojamientoId") UUID alojamientoId);

    @Modifying
    @Query("UPDATE AlojamientoImagen ai SET ai.esPrincipal = false WHERE ai.alojamientoId = :alojamientoId")
    void desmarcarTodasComoPrincipal(@Param("alojamientoId") UUID alojamientoId);

    @Modifying
    @Query("UPDATE AlojamientoImagen ai SET ai.esPrincipal = true WHERE ai.id = :imagenId")
    void marcarComoPrincipal(@Param("imagenId") UUID imagenId);

    @Query("SELECT ai FROM AlojamientoImagen ai WHERE ai.alojamientoId = :alojamientoId AND ai.esPrincipal = true")
    Optional<AlojamientoImagen> findImagenPrincipal(@Param("alojamientoId") UUID alojamientoId);

    @Query("SELECT ai.urlImagen FROM AlojamientoImagen ai WHERE ai.alojamientoId = :alojamientoId " +
           "ORDER BY CASE WHEN ai.esPrincipal = true THEN 0 ELSE ai.orden END LIMIT 1")
    Optional<String> findPrimeraImagenUrl(@Param("alojamientoId") UUID alojamientoId);

    @Modifying
    @Query("DELETE FROM AlojamientoImagen ai WHERE ai.alojamientoId = :alojamientoId")
    void deleteByAlojamientoId(@Param("alojamientoId") UUID alojamientoId);

    @Query("SELECT ai FROM AlojamientoImagen ai WHERE ai.alojamientoId = :alojamientoId " +
           "ORDER BY CASE WHEN ai.esPrincipal = true THEN 0 ELSE 1 END, ai.orden")
    List<AlojamientoImagen> findByAlojamientoIdOrdenadaPorPrincipal(@Param("alojamientoId") UUID alojamientoId);
}
