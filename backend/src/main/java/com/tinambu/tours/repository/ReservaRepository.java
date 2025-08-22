package com.tinambu.tours.repository;

import com.tinambu.tours.entity.reserva.Reserva;
import com.tinambu.tours.entity.reserva.EstadoReserva;
import com.tinambu.tours.entity.usuario.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
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
     * Buscar reservas por estado - SIMPLIFICADO
     */
    List<Reserva> findByEstadoOrderByFechaCreacionDesc(EstadoReserva estado);

    /**
     * Contar reservas por estado - SIMPLIFICADO
     */
    long countByEstado(EstadoReserva estado);

    /**
     * Buscar por rango de fechas - SIMPLIFICADO
     */
    List<Reserva> findByFechaInicioBetweenOrderByFechaInicio(LocalDate fechaInicio, LocalDate fechaFin);
}