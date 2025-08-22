package com.tinambu.tours.service.strategy.reserva;

import com.tinambu.tours.entity.reserva.Reserva;
import com.tinambu.tours.dto.request.ReservaRequest;

/**
 * Strategy Pattern para diferentes tipos de reservas
 * Cada tipo de reserva (Alojamiento, Sendero) implementa su propia lógica específica
 */
public interface ReservaStrategy {

    /**
     * Validar que la reserva cumple con las reglas de negocio específicas del tipo
     */
    void validarDisponibilidad(ReservaRequest request);

    /**
     * Crear la reserva específica del tipo
     */
    Reserva crearReserva(ReservaRequest request);

    /**
     * Verificar si hay conflictos con reservas existentes
     */
    boolean tieneConflictos(ReservaRequest request);

    /**
     * Bloquear los recursos necesarios (habitación, guía, etc.)
     */
    void bloquearRecursos(Reserva reserva);

    /**
     * Liberar los recursos bloqueados (en caso de cancelación)
     */
    void liberarRecursos(Reserva reserva);

    /**
     * Calcular el precio total específico del tipo de reserva
     */
    java.math.BigDecimal calcularPrecioTotal(ReservaRequest request);

    /**
     * Obtener información adicional específica del tipo de reserva
     */
    String obtenerInformacionAdicional(Reserva reserva);
}
