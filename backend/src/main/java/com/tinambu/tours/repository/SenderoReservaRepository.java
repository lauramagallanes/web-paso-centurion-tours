package com.tinambu.tours.repository;

import com.tinambu.tours.entity.reserva.SenderoReserva;
import com.tinambu.tours.entity.reserva.EstadoReserva;
import com.tinambu.tours.entity.guia.Guia;
import com.tinambu.tours.entity.sendero.Sendero;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface SenderoReservaRepository extends JpaRepository<SenderoReserva, UUID> {

    /**
     * Buscar reservas por guía - SIMPLIFICADO
     */
    List<SenderoReserva> findByGuiaAndEstadoInOrderByFechaInicio(Guia guia, List<EstadoReserva> estados);

    /**
     * Buscar reservas por sendero - SIMPLIFICADO
     */
    List<SenderoReserva> findBySenderoAndEstadoInOrderByFechaInicio(Sendero sendero, List<EstadoReserva> estados);

    /**
     * Buscar por rango de fechas - SIMPLIFICADO
     */
    List<SenderoReserva> findByFechaInicioBetweenOrderByFechaInicio(LocalDate fechaInicio, LocalDate fechaFin);
}