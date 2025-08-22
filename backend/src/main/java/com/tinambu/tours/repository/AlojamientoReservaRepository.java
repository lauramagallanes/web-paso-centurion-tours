package com.tinambu.tours.repository;

import com.tinambu.tours.entity.reserva.AlojamientoReserva;
import com.tinambu.tours.entity.reserva.EstadoReserva;
import com.tinambu.tours.entity.habitacion.Habitacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface AlojamientoReservaRepository extends JpaRepository<AlojamientoReserva, UUID> {

    /**
     * Buscar reservas por habitación - SIMPLIFICADO
     */
    List<AlojamientoReserva> findByHabitacionAndEstadoInOrderByFechaInicio(Habitacion habitacion, List<EstadoReserva> estados);

    /**
     * Buscar por número de personas
     */
    List<AlojamientoReserva> findByNumeroPersonasOrderByFechaCreacionDesc(Integer numeroPersonas);

    /**
     * Buscar por número de noches
     */
    List<AlojamientoReserva> findByNumeroNochesOrderByFechaCreacionDesc(Integer numeroNoches);

    /**
     * Buscar por rango de fechas - SIMPLIFICADO
     */
    List<AlojamientoReserva> findByFechaInicioBetweenOrderByFechaInicio(LocalDate fechaInicio, LocalDate fechaFin);
}