package com.tinambu.tours.service;

import com.tinambu.tours.dto.request.ReservaRequest;
import com.tinambu.tours.entity.reserva.EstadoReserva;
import com.tinambu.tours.entity.reserva.Reserva;
import com.tinambu.tours.entity.reserva.TipoReserva;
import com.tinambu.tours.repository.ReservaRepository;
import com.tinambu.tours.service.factory.reserva.ReservaFactory;
import com.tinambu.tours.service.strategy.reserva.ReservaStrategy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Servicio principal para gestión de reservas
 * Utiliza Factory + Strategy patterns para manejar diferentes tipos de reservas
 */
@Service
@Transactional
public class ReservaService {

    @Autowired
    private ReservaFactory reservaFactory;

    @Autowired
    private ReservaRepository reservaRepository;

    /**
     * Crear una nueva reserva
     * Utiliza Factory para obtener la Strategy correcta y procesa la reserva
     */
    public Reserva crearReserva(ReservaRequest request) {
        // 1. Factory: Obtener la strategy correcta
        ReservaStrategy strategy = reservaFactory.getStrategy(request.getTipoReserva());

        // 2. Strategy: Validar disponibilidad específica del tipo
        strategy.validarDisponibilidad(request);

        // 3. Strategy: Crear la reserva específica
        Reserva reserva = strategy.crearReserva(request);

        // 4. Guardar la reserva
        reserva = reservaRepository.save(reserva);

        // 5. Strategy: Bloquear recursos
        strategy.bloquearRecursos(reserva);

        return reserva;
    }

    /**
     * Confirmar una reserva (cambiar de PENDIENTE a CONFIRMADA)
     */
    public Reserva confirmarReserva(UUID reservaId) {
        Reserva reserva = obtenerReservaPorId(reservaId);
        
        if (reserva.getEstado() != EstadoReserva.PENDIENTE) {
            throw new IllegalStateException("Solo se pueden confirmar reservas pendientes");
        }

        reserva.cambiarEstado(EstadoReserva.CONFIRMADA);
        return reservaRepository.save(reserva);
    }

    /**
     * Cancelar una reserva
     */
    public Reserva cancelarReserva(UUID reservaId) {
        Reserva reserva = obtenerReservaPorId(reservaId);
        
        if (!reserva.estaActiva()) {
            throw new IllegalStateException("Solo se pueden cancelar reservas activas");
        }

        // Obtener strategy para liberar recursos
        ReservaStrategy strategy = reservaFactory.getStrategy(reserva.getTipoReserva());
        strategy.liberarRecursos(reserva);

        reserva.cambiarEstado(EstadoReserva.CANCELADA);
        return reservaRepository.save(reserva);
    }

    /**
     * Completar una reserva
     */
    public Reserva completarReserva(UUID reservaId) {
        Reserva reserva = obtenerReservaPorId(reservaId);
        
        if (reserva.getEstado() != EstadoReserva.CONFIRMADA) {
            throw new IllegalStateException("Solo se pueden completar reservas confirmadas");
        }

        // Obtener strategy para liberar recursos
        ReservaStrategy strategy = reservaFactory.getStrategy(reserva.getTipoReserva());
        strategy.liberarRecursos(reserva);

        reserva.cambiarEstado(EstadoReserva.COMPLETADA);
        return reservaRepository.save(reserva);
    }

    /**
     * Verificar disponibilidad sin crear la reserva
     */
    @Transactional(readOnly = true)
    public boolean verificarDisponibilidad(ReservaRequest request) {
        try {
            ReservaStrategy strategy = reservaFactory.getStrategy(request.getTipoReserva());
            strategy.validarDisponibilidad(request);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Obtener información detallada de disponibilidad
     */
    @Transactional(readOnly = true)
    public String obtenerInformacionDisponibilidad(ReservaRequest request) {
        try {
            ReservaStrategy strategy = reservaFactory.getStrategy(request.getTipoReserva());
            strategy.validarDisponibilidad(request);
            return "Disponible";
        } catch (Exception e) {
            return e.getMessage();
        }
    }

    /**
     * Calcular precio de una reserva sin crearla
     */
    @Transactional(readOnly = true)
    public java.math.BigDecimal calcularPrecio(ReservaRequest request) {
        ReservaStrategy strategy = reservaFactory.getStrategy(request.getTipoReserva());
        return strategy.calcularPrecioTotal(request);
    }

    // Métodos de consulta
    @Transactional(readOnly = true)
    public Reserva obtenerReservaPorId(UUID id) {
        return reservaRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada"));
    }

    @Transactional(readOnly = true)
    public Optional<Reserva> obtenerReservaPorCodigo(String codigoReserva) {
        return reservaRepository.findByCodigoReserva(codigoReserva);
    }

    @Transactional(readOnly = true)
    public List<Reserva> obtenerReservasPorEmail(String email) {
        return reservaRepository.findByEmailContactoOrderByFechaCreacionDesc(email);
    }

    @Transactional(readOnly = true)
    public List<Reserva> obtenerReservasPorEstado(EstadoReserva estado) {
        return reservaRepository.findByEstadoOrderByFechaCreacionDesc(estado);
    }

    @Transactional(readOnly = true)
    public List<Reserva> obtenerReservasActivas() {
        return reservaRepository.findReservasActivas();
    }

    @Transactional(readOnly = true)
    public List<Reserva> obtenerReservasPorRangoFechas(LocalDate fechaInicio, LocalDate fechaFin) {
        return reservaRepository.findByRangoFechas(fechaInicio, fechaFin);
    }

    @Transactional(readOnly = true)
    public List<Reserva> obtenerReservasProximas(int diasAdelante) {
        LocalDate hoy = LocalDate.now();
        LocalDate fechaLimite = hoy.plusDays(diasAdelante);
        return reservaRepository.findReservasProximas(hoy, fechaLimite);
    }

    @Transactional(readOnly = true)
    public List<Reserva> obtenerReservasPendientes() {
        return reservaRepository.findReservasPendientesOrdenadasPorAntiguedad();
    }

    // Métodos de estadísticas
    @Transactional(readOnly = true)
    public long contarReservasPorEstado(EstadoReserva estado) {
        return reservaRepository.countByEstado(estado);
    }

    @Transactional(readOnly = true)
    public List<Object[]> obtenerEstadisticasPorMes(int mesesAtras) {
        LocalDateTime fechaInicio = LocalDateTime.now().minusMonths(mesesAtras);
        return reservaRepository.findEstadisticasPorMes(fechaInicio);
    }

    /**
     * Obtener información adicional de una reserva usando su strategy específica
     */
    @Transactional(readOnly = true)
    public String obtenerInformacionAdicional(UUID reservaId) {
        Reserva reserva = obtenerReservaPorId(reservaId);
        ReservaStrategy strategy = reservaFactory.getStrategy(reserva.getTipoReserva());
        return strategy.obtenerInformacionAdicional(reserva);
    }
}
