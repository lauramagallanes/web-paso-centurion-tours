package com.tinambu.tours.repository;

import com.tinambu.tours.entity.sendero.SenderoDisponibilidadGuia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SenderoDisponibilidadGuiaRepository extends JpaRepository<SenderoDisponibilidadGuia, UUID> {

    // Find all active guide assignments for a sendero availability
    List<SenderoDisponibilidadGuia> findBySenderoDisponibilidadIdAndActivoTrue(UUID senderoDisponibilidadId);

    // Find all active guide assignments for a specific guide
    List<SenderoDisponibilidadGuia> findByGuiaIdAndActivoTrue(UUID guiaId);

    // Find assignment for specific sendero availability and guide
    List<SenderoDisponibilidadGuia> findBySenderoDisponibilidadIdAndGuiaIdAndActivoTrue(UUID senderoDisponibilidadId, UUID guiaId);

    // Get all guide IDs assigned to a sendero availability
    @Query("SELECT sdg.guiaId FROM SenderoDisponibilidadGuia sdg WHERE sdg.senderoDisponibilidadId = :senderoDisponibilidadId AND sdg.activo = true")
    List<UUID> findGuiaIdsBySenderoDisponibilidadId(@Param("senderoDisponibilidadId") UUID senderoDisponibilidadId);

    // Check if guide is assigned to specific sendero availability
    @Query("SELECT COUNT(sdg) > 0 FROM SenderoDisponibilidadGuia sdg WHERE sdg.senderoDisponibilidadId = :senderoDisponibilidadId AND sdg.guiaId = :guiaId AND sdg.activo = true")
    boolean isGuiaAssignedToAvailability(@Param("senderoDisponibilidadId") UUID senderoDisponibilidadId, 
                                        @Param("guiaId") UUID guiaId);

    // Deactivate all guide assignments for a sendero availability
    @Modifying
    @Query("UPDATE SenderoDisponibilidadGuia sdg SET sdg.activo = false WHERE sdg.senderoDisponibilidadId = :senderoDisponibilidadId")
    void deactivateAllForAvailability(@Param("senderoDisponibilidadId") UUID senderoDisponibilidadId);

    // Deactivate specific guide assignment
    @Modifying
    @Query("UPDATE SenderoDisponibilidadGuia sdg SET sdg.activo = false WHERE sdg.senderoDisponibilidadId = :senderoDisponibilidadId AND sdg.guiaId = :guiaId")
    void deactivateGuiaAssignment(@Param("senderoDisponibilidadId") UUID senderoDisponibilidadId, 
                                  @Param("guiaId") UUID guiaId);

    // Find all sendero availability IDs where guide is assigned
    @Query("SELECT sdg.senderoDisponibilidadId FROM SenderoDisponibilidadGuia sdg WHERE sdg.guiaId = :guiaId AND sdg.activo = true")
    List<UUID> findSenderoDisponibilidadIdsByGuiaId(@Param("guiaId") UUID guiaId);

    // Delete all assignments for a sendero availability
    void deleteBySenderoDisponibilidadId(UUID senderoDisponibilidadId);

    // Delete all assignments for a guide
    void deleteByGuiaId(UUID guiaId);

    // Count active assignments for a sendero availability
    @Query("SELECT COUNT(sdg) FROM SenderoDisponibilidadGuia sdg WHERE sdg.senderoDisponibilidadId = :senderoDisponibilidadId AND sdg.activo = true")
    long countActiveBySenderoDisponibilidadId(@Param("senderoDisponibilidadId") UUID senderoDisponibilidadId);
}
