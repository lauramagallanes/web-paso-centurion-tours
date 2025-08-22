package com.tinambu.tours.service.strategy.reserva;

import com.tinambu.tours.dto.request.ReservaRequest;
import com.tinambu.tours.entity.habitacion.Habitacion;
import com.tinambu.tours.entity.reserva.AlojamientoReserva;
import com.tinambu.tours.entity.reserva.Reserva;
import com.tinambu.tours.entity.usuario.Usuario;
import com.tinambu.tours.repository.AlojamientoReservaRepository;
import com.tinambu.tours.repository.HabitacionRepository;
import com.tinambu.tours.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

@Component("alojamientoReservaStrategy")
public class AlojamientoReservaStrategy implements ReservaStrategy {

    @Autowired
    private HabitacionRepository habitacionRepository;

    @Autowired
    private AlojamientoReservaRepository alojamientoReservaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    public void validarDisponibilidad(ReservaRequest request) {
        // 1. Validar que la habitación existe y está activa
        Habitacion habitacion = habitacionRepository.findById(request.getHabitacionId())
            .orElseThrow(() -> new IllegalArgumentException("Habitación no encontrada"));

        if (!habitacion.getActiva()) {
            throw new IllegalArgumentException("La habitación seleccionada no está disponible");
        }

        // 2. Validar capacidad de la habitación
        if (!habitacion.puedeAcomodar(request.getNumeroPersonas())) {
            throw new IllegalArgumentException(
                String.format("Habitación %s no puede acomodar %d personas (capacidad: %d-%d)",
                    habitacion.getNumero(), request.getNumeroPersonas(), 
                    habitacion.getCapacidadMinima(), habitacion.getCapacidadMaxima())
            );
        }

        // 3. Validar mínimo una noche
        int numeroNoches = calcularNumeroNoches(request);
        if (numeroNoches < 1) {
            throw new IllegalArgumentException("Reserva de alojamiento debe ser mínimo una noche");
        }

        // 4. Validar disponibilidad en las fechas solicitadas
        if (!habitacionRepository.isHabitacionDisponible(
                request.getHabitacionId(), 
                request.getFechaInicio(), 
                request.getFechaFin())) {
            throw new IllegalArgumentException(
                String.format("Habitación %s no está disponible del %s al %s",
                    habitacion.getNumero(), 
                    request.getFechaInicio().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                    request.getFechaFin().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
            );
        }
    }

    @Override
    public Reserva crearReserva(ReservaRequest request) {
        // Obtener la habitación
        Habitacion habitacion = habitacionRepository.findById(request.getHabitacionId())
            .orElseThrow(() -> new IllegalArgumentException("Habitación no encontrada"));

        // Crear la reserva de alojamiento
        AlojamientoReserva reserva = new AlojamientoReserva(
            request.getEmailContacto(),
            request.getNombreContacto(),
            request.getNumeroPersonas(),
            request.getFechaInicio(),
            request.getFechaFin(),
            habitacion
        );

        // Configurar campos adicionales
        reserva.setTelefonoContacto(request.getTelefonoContacto());
        reserva.setObservaciones(request.getObservaciones());

        // Asociar usuario si está presente
        if (request.getUsuarioId() != null) {
            Usuario usuario = usuarioRepository.findById(request.getUsuarioId()).orElse(null);
            reserva.setUsuario(usuario);
        }

        // Validar la reserva antes de crearla
        reserva.validarReserva();

        return reserva;
    }

    @Override
    public boolean tieneConflictos(ReservaRequest request) {
        return alojamientoReservaRepository.existeConflictoReserva(
            request.getHabitacionId(),
            request.getFechaInicio(),
            request.getFechaFin(),
            null // No excluir ninguna reserva
        );
    }

    @Override
    public void bloquearRecursos(Reserva reserva) {
        // Para alojamiento, el bloqueo es implícito - la habitación queda completamente bloqueada
        // por la existencia de la reserva en estado PENDIENTE o CONFIRMADA
        
        AlojamientoReserva alojamientoReserva = (AlojamientoReserva) reserva;
        
        // Log para auditoría
        System.out.println(String.format(
            "BLOQUEO ALOJAMIENTO: Habitación %s bloqueada del %s al %s para %d personas",
            alojamientoReserva.getHabitacion().getNumero(),
            alojamientoReserva.getFechaInicio(),
            alojamientoReserva.getFechaFin(),
            alojamientoReserva.getNumeroPersonas()
        ));
    }

    @Override
    public void liberarRecursos(Reserva reserva) {
        // Para alojamiento, la liberación es implícita - cuando la reserva se cancela
        // o completa, automáticamente libera la habitación
        
        AlojamientoReserva alojamientoReserva = (AlojamientoReserva) reserva;
        
        // Log para auditoría
        System.out.println(String.format(
            "LIBERACIÓN ALOJAMIENTO: Habitación %s liberada del %s al %s",
            alojamientoReserva.getHabitacion().getNumero(),
            alojamientoReserva.getFechaInicio(),
            alojamientoReserva.getFechaFin()
        ));
    }

    @Override
    public BigDecimal calcularPrecioTotal(ReservaRequest request) {
        Habitacion habitacion = habitacionRepository.findById(request.getHabitacionId())
            .orElseThrow(() -> new IllegalArgumentException("Habitación no encontrada"));

        int numeroNoches = calcularNumeroNoches(request);
        
        return habitacion.calcularPrecioTotal(request.getNumeroPersonas(), numeroNoches);
    }

    @Override
    public String obtenerInformacionAdicional(Reserva reserva) {
        AlojamientoReserva alojamientoReserva = (AlojamientoReserva) reserva;
        
        return String.format(
            "Habitación: %s - %s | Capacidad: %d-%d personas | %d noches | Precio por persona/noche: $%.2f UYU",
            alojamientoReserva.getHabitacion().getNumero(),
            alojamientoReserva.getHabitacion().getNombre(),
            alojamientoReserva.getHabitacion().getCapacidadMinima(),
            alojamientoReserva.getHabitacion().getCapacidadMaxima(),
            alojamientoReserva.getNumeroNoches(),
            alojamientoReserva.getHabitacion().getPrecioPorPersonaNoche()
        );
    }

    // Helper methods
    private int calcularNumeroNoches(ReservaRequest request) {
        return (int) (request.getFechaFin().toEpochDay() - request.getFechaInicio().toEpochDay());
    }
}
