package com.tinambu.tours.repository;

import com.tinambu.tours.entity.reserva.Reserva;
import com.tinambu.tours.entity.reserva.EstadoReserva;
import com.tinambu.tours.entity.reserva.TipoReserva;
import com.tinambu.tours.entity.usuario.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReservaRepository extends JpaRepository<Reserva, UUID> {

    /**
     * Buscar reserva por código
     */
    Optional<Reserva> findByCodigoReserva(String codigoReserva);

    /**
     * Buscar reservas por usuario
     */
    List<Reserva> findByUsuarioOrderByFechaCreacionDesc(Usuario usuario);

    /**
     * Buscar reservas por email de contacto
     */
    List<Reserva> findByEmailContactoOrderByFechaCreacionDesc(String emailContacto);

    /**
     * Buscar reservas por estado
     */
    List<Reserva> findByEstadoOrderByFechaCreacionDesc(EstadoReserva estado);

    /**
     * Buscar reservas por tipo
     */
    @Query("SELECT r FROM Reserva r WHERE TYPE(r) = :tipoClase ORDER BY r.fechaCreacion DESC")
    List<Reserva> findByTipoReserva(@Param("tipoClase") Class<? extends Reserva> tipoClase);

    /**
     * Buscar reservas activas (pendientes o confirmadas)
     */
    @Query("SELECT r FROM Reserva r WHERE r.estado IN ('PENDIENTE', 'CONFIRMADA') ORDER BY r.fechaInicio")
    List<Reserva> findReservasActivas();

    /**
     * Buscar reservas por rango de fechas
     */
    @Query("SELECT r FROM Reserva r WHERE r.fechaInicio >= :fechaInicio AND r.fechaFin <= :fechaFin ORDER BY r.fechaInicio")
    List<Reserva> findByRangoFechas(
        @Param("fechaInicio") LocalDate fechaInicio,
        @Param("fechaFin") LocalDate fechaFin
    );

    /**
     * Buscar reservas que se superponen con un rango de fechas
     */
    @Query("SELECT r FROM Reserva r WHERE NOT (r.fechaFin < :fechaInicio OR r.fechaInicio > :fechaFin) AND r.estado IN ('PENDIENTE', 'CONFIRMADA')")
    List<Reserva> findReservasSuperpuestas(
        @Param("fechaInicio") LocalDate fechaInicio,
        @Param("fechaFin") LocalDate fechaFin
    );

    /**
     * Buscar reservas creadas en un período
     */
    @Query("SELECT r FROM Reserva r WHERE r.fechaCreacion BETWEEN :fechaInicio AND :fechaFin ORDER BY r.fechaCreacion DESC")
    List<Reserva> findByPeriodoCreacion(
        @Param("fechaInicio") LocalDateTime fechaInicio,
        @Param("fechaFin") LocalDateTime fechaFin
    );

    /**
     * Contar reservas por estado
     */
    long countByEstado(EstadoReserva estado);

    /**
     * Contar reservas por tipo
     */
    @Query("SELECT COUNT(r) FROM Reserva r WHERE TYPE(r) = :tipoClase")
    long countByTipoReserva(@Param("tipoClase") Class<? extends Reserva> tipoClase);

    /**
     * Buscar reservas próximas (en los próximos N días)
     */
    @Query("SELECT r FROM Reserva r WHERE r.fechaInicio BETWEEN :hoy AND :fechaLimite AND r.estado = 'CONFIRMADA' ORDER BY r.fechaInicio")
    List<Reserva> findReservasProximas(
        @Param("hoy") LocalDate hoy,
        @Param("fechaLimite") LocalDate fechaLimite
    );

    /**
     * Buscar reservas por nombre de contacto
     */
    @Query("SELECT r FROM Reserva r WHERE LOWER(r.nombreContacto) LIKE LOWER(CONCAT('%', :nombre, '%')) ORDER BY r.fechaCreacion DESC")
    List<Reserva> findByNombreContactoContaining(@Param("nombre") String nombre);

    /**
     * Obtener estadísticas de reservas por mes
     */
    @Query("""
        SELECT YEAR(r.fechaCreacion) as año, MONTH(r.fechaCreacion) as mes, 
               COUNT(r) as totalReservas, 
               SUM(r.precioTotal) as ingresoTotal,
               COUNT(CASE WHEN r.estado = 'CONFIRMADA' THEN 1 END) as confirmadas,
               COUNT(CASE WHEN r.estado = 'PENDIENTE' THEN 1 END) as pendientes
        FROM Reserva r 
        WHERE r.fechaCreacion >= :fechaInicio
        GROUP BY YEAR(r.fechaCreacion), MONTH(r.fechaCreacion)
        ORDER BY año DESC, mes DESC
    """)
    List<Object[]> findEstadisticasPorMes(@Param("fechaInicio") LocalDateTime fechaInicio);

    /**
     * Buscar reservas pendientes más antiguas
     */
    @Query("SELECT r FROM Reserva r WHERE r.estado = 'PENDIENTE' ORDER BY r.fechaCreacion ASC")
    List<Reserva> findReservasPendientesOrdenadasPorAntiguedad();
}
