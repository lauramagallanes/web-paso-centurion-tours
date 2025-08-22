package com.tinambu.tours.service.strategy.reserva;

import com.tinambu.tours.dto.request.ReservaRequest;
import com.tinambu.tours.entity.guia.Guia;
import com.tinambu.tours.entity.reserva.Reserva;
import com.tinambu.tours.entity.reserva.SenderoReserva;
import com.tinambu.tours.entity.sendero.Sendero;
import com.tinambu.tours.entity.usuario.Usuario;
import com.tinambu.tours.repository.GuiaRepository;
import com.tinambu.tours.repository.SenderoRepository;
import com.tinambu.tours.repository.SenderoReservaRepository;
import com.tinambu.tours.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Component("senderoReservaStrategy")
public class SenderoReservaStrategy implements ReservaStrategy {

    @Autowired
    private SenderoRepository senderoRepository;

    @Autowired
    private GuiaRepository guiaRepository;

    @Autowired
    private SenderoReservaRepository senderoReservaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    public void validarDisponibilidad(ReservaRequest request) {
        // 1. Validar que el sendero existe y está activo
        Sendero sendero = senderoRepository.findById(request.getSenderoId())
            .orElseThrow(() -> new IllegalArgumentException("Sendero no encontrado"));

        if (!sendero.getActivo()) {
            throw new IllegalArgumentException("El sendero seleccionado no está disponible");
        }

        // 2. Validar que el guía existe y está activo
        Guia guia = guiaRepository.findById(request.getGuiaId())
            .orElseThrow(() -> new IllegalArgumentException("Guía no encontrado"));

        if (!guia.getActivo()) {
            throw new IllegalArgumentException("El guía seleccionado no está disponible");
        }

        // 3. Validar disponibilidad del guía en todas las fechas y turnos solicitados
        validarDisponibilidadGuiaEnRangoFechas(request);

        // 4. Validar capacidad del sendero considerando grupos existentes
        validarCapacidadSenderoEnRangoFechas(request, sendero);
    }

    private void validarDisponibilidadGuiaEnRangoFechas(ReservaRequest request) {
        LocalDate fechaActual = request.getFechaInicio();
        
        while (!fechaActual.isAfter(request.getFechaFin())) {
            if (!senderoReservaRepository.isGuiaDisponibleEnFechaTurno(
                    request.getGuiaId(), 
                    request.getTurno(), 
                    fechaActual, 
                    null)) {
                
                Guia guia = guiaRepository.findById(request.getGuiaId()).orElse(null);
                throw new IllegalArgumentException(
                    String.format("Guía %s no está disponible el %s en turno %s",
                        guia != null ? guia.getNombreCompleto() : "desconocido",
                        fechaActual.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                        request.getTurno().getDescripcion())
                );
            }
            fechaActual = fechaActual.plusDays(1);
        }
    }

    private void validarCapacidadSenderoEnRangoFechas(ReservaRequest request, Sendero sendero) {
        LocalDate fechaActual = request.getFechaInicio();
        
        while (!fechaActual.isAfter(request.getFechaFin())) {
            int personasExistentes = senderoReservaRepository.countPersonasEnSenderoFechaTurno(
                request.getSenderoId(),
                request.getGuiaId(),
                request.getTurno(),
                fechaActual,
                null
            );

            int personasTotales = personasExistentes + request.getNumeroPersonas();

            if (personasTotales > sendero.getCapacidadMaximaGrupo()) {
                throw new IllegalArgumentException(
                    String.format("Sendero %s excede capacidad máxima el %s turno %s (solicitadas: %d, existentes: %d, máximo: %d)",
                        sendero.getNombre(),
                        fechaActual.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                        request.getTurno().getDescripcion(),
                        request.getNumeroPersonas(),
                        personasExistentes,
                        sendero.getCapacidadMaximaGrupo())
                );
            }
            fechaActual = fechaActual.plusDays(1);
        }
    }

    @Override
    public Reserva crearReserva(ReservaRequest request) {
        // Obtener sendero y guía
        Sendero sendero = senderoRepository.findById(request.getSenderoId())
            .orElseThrow(() -> new IllegalArgumentException("Sendero no encontrado"));

        Guia guia = guiaRepository.findById(request.getGuiaId())
            .orElseThrow(() -> new IllegalArgumentException("Guía no encontrado"));

        // Crear la reserva de sendero
        SenderoReserva reserva = new SenderoReserva(
            request.getEmailContacto(),
            request.getNombreContacto(),
            request.getNumeroPersonas(),
            request.getFechaInicio(),
            request.getFechaFin(),
            sendero,
            guia,
            request.getTurno()
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
        // Para senderos, hay conflicto si el guía no está disponible en alguna fecha/turno
        LocalDate fechaActual = request.getFechaInicio();
        
        while (!fechaActual.isAfter(request.getFechaFin())) {
            if (!senderoReservaRepository.isGuiaDisponibleEnFechaTurno(
                    request.getGuiaId(), 
                    request.getTurno(), 
                    fechaActual, 
                    null)) {
                return true; // Hay conflicto
            }
            fechaActual = fechaActual.plusDays(1);
        }
        
        return false; // No hay conflictos
    }

    @Override
    public void bloquearRecursos(Reserva reserva) {
        // Para senderos, se bloquea el guía en el turno específico para cada día
        SenderoReserva senderoReserva = (SenderoReserva) reserva;
        
        LocalDate fechaActual = senderoReserva.getFechaInicio();
        while (!fechaActual.isAfter(senderoReserva.getFechaFin())) {
            // Log para auditoría
            System.out.println(String.format(
                "BLOQUEO SENDERO: Guía %s bloqueado el %s turno %s para sendero %s (%d personas)",
                senderoReserva.getGuia().getNombreCompleto(),
                fechaActual.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                senderoReserva.getTurno().getDescripcion(),
                senderoReserva.getSendero().getNombre(),
                senderoReserva.getNumeroPersonas()
            ));
            fechaActual = fechaActual.plusDays(1);
        }
    }

    @Override
    public void liberarRecursos(Reserva reserva) {
        // Para senderos, se libera el guía en el turno específico para cada día
        SenderoReserva senderoReserva = (SenderoReserva) reserva;
        
        LocalDate fechaActual = senderoReserva.getFechaInicio();
        while (!fechaActual.isAfter(senderoReserva.getFechaFin())) {
            // Log para auditoría
            System.out.println(String.format(
                "LIBERACIÓN SENDERO: Guía %s liberado el %s turno %s para sendero %s",
                senderoReserva.getGuia().getNombreCompleto(),
                fechaActual.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                senderoReserva.getTurno().getDescripcion(),
                senderoReserva.getSendero().getNombre()
            ));
            fechaActual = fechaActual.plusDays(1);
        }
    }

    @Override
    public BigDecimal calcularPrecioTotal(ReservaRequest request) {
        Sendero sendero = senderoRepository.findById(request.getSenderoId())
            .orElseThrow(() -> new IllegalArgumentException("Sendero no encontrado"));

        int numeroDias = calcularNumeroDias(request);
        
        return sendero.calcularPrecioTotal(request.getNumeroPersonas())
                     .multiply(BigDecimal.valueOf(numeroDias));
    }

    @Override
    public String obtenerInformacionAdicional(Reserva reserva) {
        SenderoReserva senderoReserva = (SenderoReserva) reserva;
        
        return String.format(
            "Sendero: %s | Guía: %s | Turno: %s | Duración: %.1f horas | Dificultad: %s | %d días | Precio por persona/día: $%.2f UYU",
            senderoReserva.getSendero().getNombre(),
            senderoReserva.getGuia().getNombreCompleto(),
            senderoReserva.getTurno().getDescripcion(),
            senderoReserva.getSendero().getDuracionHoras(),
            senderoReserva.getSendero().getNivelDificultad().getDescripcion(),
            senderoReserva.getNumeroDias(),
            senderoReserva.getSendero().getPrecioPorPersona()
        );
    }

    // Helper methods
    private int calcularNumeroDias(ReservaRequest request) {
        return (int) (request.getFechaFin().toEpochDay() - request.getFechaInicio().toEpochDay() + 1);
    }
}
