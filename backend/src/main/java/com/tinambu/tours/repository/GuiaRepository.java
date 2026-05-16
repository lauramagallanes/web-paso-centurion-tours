package com.tinambu.tours.repository;

import com.tinambu.tours.entity.guia.Guia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GuiaRepository extends JpaRepository<Guia, UUID> {

    List<Guia> findByActivoTrue();

    Optional<Guia> findByEmail(String email);

    Long countByActivoTrue();

    @Query("SELECT g FROM Guia g WHERE g.activo = true ORDER BY g.nombre")
    List<Guia> findAllActiveOrderByName();

    @Query("SELECT g FROM Guia g WHERE g.activo = true AND g.especialidades LIKE CONCAT('%', :especialidad, '%')")
    List<Guia> findByEspecialidadContaining(@Param("especialidad") String especialidad);

    @Query("SELECT g FROM Guia g WHERE g.activo = true AND g.anosExperiencia >= :min")
    List<Guia> findByAnosExperienciaMinima(@Param("min") Integer min);

    @Query("SELECT g FROM Guia g WHERE LOWER(CONCAT(g.nombre, ' ', g.apellido)) LIKE LOWER(CONCAT('%', :nombre, '%'))")
    List<Guia> findByNombreCompletoContaining(@Param("nombre") String nombre);

    List<Guia> findAllByOrderByAnosExperienciaDesc();
}
