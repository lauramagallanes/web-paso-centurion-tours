package com.tinambu.tours.repository;

import com.tinambu.tours.entity.guia.Guia;
import com.tinambu.tours.entity.reserva.TurnoSendero;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GuiaRepository extends JpaRepository<Guia, UUID> {

    /**
     * Buscar guía por email
     */
    Optional<Guia> findByEmail(String email);

    /**
     * Buscar guías activos
     */
    List<Guia> findByActivoTrue();

    /**
     * Buscar guías por especialidad
     */
    @Query("SELECT g FROM Guia g WHERE LOWER(g.especialidades) LIKE LOWER(CONCAT('%', :especialidad, '%')) AND g.activo = true")
    List<Guia> findByEspecialidadContaining(@Param("especialidad") String especialidad);

    /**
     * Buscar guías disponibles en una fecha y turno específico
     * Un guía está disponible si NO tiene reservas confirmadas o pendientes en esa fecha y turno
     */
    @Query("""
        SELECT g FROM Guia g 
        WHERE g.activo = true 
        AND g.id NOT IN (
            SELECT sr.guia.id FROM SenderoReserva sr 
            WHERE sr.estado IN ('PENDIENTE', 'CONFIRMADA')
            AND sr.fechaInicio <= :fecha 
            AND sr.fechaFin >= :fecha
            AND sr.turno = :turno
        )
        ORDER BY g.nombre, g.apellido
    """)
    List<Guia> findGuiasDisponibles(
        @Param("fecha") LocalDate fecha,
        @Param("turno") TurnoSendero turno
    );

    /**
     * Verificar si un guía específico está disponible en una fecha y turno
     */
    @Query("""
        SELECT CASE WHEN COUNT(sr) = 0 THEN true ELSE false END
        FROM SenderoReserva sr 
        WHERE sr.guia.id = :guiaId
        AND sr.estado IN ('PENDIENTE', 'CONFIRMADA')
        AND sr.fechaInicio <= :fecha 
        AND sr.fechaFin >= :fecha
        AND sr.turno = :turno
    """)
    boolean isGuiaDisponible(
        @Param("guiaId") UUID guiaId,
        @Param("fecha") LocalDate fecha,
        @Param("turno") TurnoSendero turno
    );

    /**
     * Buscar guías por años de experiencia mínima
     */
    @Query("SELECT g FROM Guia g WHERE g.anosExperiencia >= :anosMinimos AND g.activo = true ORDER BY g.anosExperiencia DESC")
    List<Guia> findByAnosExperienciaMinima(@Param("anosMinimos") Integer anosMinimos);

    /**
     * Buscar guías ordenados por experiencia
     */
    @Query("SELECT g FROM Guia g WHERE g.activo = true ORDER BY g.anosExperiencia DESC, g.nombre")
    List<Guia> findAllOrderByExperiencia();

    /**
     * Buscar guías por nombre completo (búsqueda parcial)
     */
    @Query("SELECT g FROM Guia g WHERE (LOWER(g.nombre) LIKE LOWER(CONCAT('%', :nombre, '%')) OR LOWER(g.apellido) LIKE LOWER(CONCAT('%', :nombre, '%'))) AND g.activo = true")
    List<Guia> findByNombreCompletoContaining(@Param("nombre") String nombre);

    /**
     * Contar guías activos
     */
    long countByActivoTrue();

    /**
     * Obtener estadísticas de disponibilidad de guías por fecha
     */
    @Query("""
        SELECT g.id, g.nombre, g.apellido,
        CASE WHEN COUNT(sr) = 0 THEN 'DISPONIBLE_TODO_DIA'
             WHEN COUNT(CASE WHEN sr.turno = 'MANANA' THEN 1 END) > 0 AND COUNT(CASE WHEN sr.turno = 'TARDE' THEN 1 END) > 0 THEN 'OCUPADO_TODO_DIA'
             WHEN COUNT(CASE WHEN sr.turno = 'MANANA' THEN 1 END) > 0 THEN 'OCUPADO_MANANA'
             ELSE 'OCUPADO_TARDE'
        END as disponibilidad
        FROM Guia g 
        LEFT JOIN SenderoReserva sr ON g.id = sr.guia.id 
        AND sr.estado IN ('PENDIENTE', 'CONFIRMADA')
        AND sr.fechaInicio <= :fecha 
        AND sr.fechaFin >= :fecha
        WHERE g.activo = true
        GROUP BY g.id, g.nombre, g.apellido
        ORDER BY g.nombre, g.apellido
    """)
    List<Object[]> findDisponibilidadGuiasPorFecha(@Param("fecha") LocalDate fecha);
}
