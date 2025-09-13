package com.tinambu.tours.repository;

import com.tinambu.tours.entity.sendero.SenderoImagen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SenderoImagenRepository extends JpaRepository<SenderoImagen, UUID> {

    // Find all images for a sendero ordered by order
    List<SenderoImagen> findBySenderoIdOrderByOrdenAsc(UUID senderoId);

    // Find main image for a sendero
    Optional<SenderoImagen> findBySenderoIdAndEsPrincipalTrue(UUID senderoId);

    // Count images for a sendero
    long countBySenderoId(UUID senderoId);

    // Find images by sendero and active
    List<SenderoImagen> findBySenderoId(UUID senderoId);

    // Update all images to not be principal for a sendero (before setting new main image)
    @Modifying
    @Query("UPDATE SenderoImagen si SET si.esPrincipal = false WHERE si.senderoId = :senderoId")
    void unmarkAllAsPrincipalForSendero(@Param("senderoId") UUID senderoId);

    // Find image by URL
    Optional<SenderoImagen> findByUrlImagen(String urlImagen);

    // Delete all images for a sendero
    void deleteBySenderoId(UUID senderoId);

    // Find images with order greater than specified value
    @Query("SELECT si FROM SenderoImagen si WHERE si.senderoId = :senderoId AND si.orden > :orden ORDER BY si.orden ASC")
    List<SenderoImagen> findBySenderoIdAndOrdenGreaterThanOrderByOrdenAsc(
        @Param("senderoId") UUID senderoId, 
        @Param("orden") Integer orden
    );

    // Update order for multiple images
    @Modifying
    @Query("UPDATE SenderoImagen si SET si.orden = si.orden - 1 WHERE si.senderoId = :senderoId AND si.orden > :deletedOrden")
    void decrementOrderAfterPosition(@Param("senderoId") UUID senderoId, @Param("deletedOrden") Integer deletedOrden);

    // Check if sendero has multiple images (for gallery indicator)
    @Query("SELECT COUNT(si) > 1 FROM SenderoImagen si WHERE si.senderoId = :senderoId")
    boolean senderoHasMultipleImages(@Param("senderoId") UUID senderoId);
}
