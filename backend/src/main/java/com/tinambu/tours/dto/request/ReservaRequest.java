package com.tinambu.tours.dto.request;

import com.tinambu.tours.entity.reserva.TipoReserva;
import com.tinambu.tours.entity.sendero.TurnoSendero;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.util.UUID;

public class ReservaRequest {

    @NotNull(message = "Tipo de reserva es obligatorio")
    private TipoReserva tipoReserva;

    @NotBlank(message = "Email de contacto es obligatorio")
    @Email(message = "Email debe tener formato válido")
    private String emailContacto;

    @NotBlank(message = "Nombre de contacto es obligatorio")
    private String nombreContacto;

    private String telefonoContacto;

    @NotNull(message = "Número de personas es obligatorio")
    @Min(value = 1, message = "Debe ser al menos 1 persona")
    private Integer numeroPersonas;

    @NotNull(message = "Fecha de inicio es obligatoria")
    @Future(message = "Fecha de inicio debe ser futura")
    private LocalDate fechaInicio;

    @NotNull(message = "Fecha de fin es obligatoria")
    private LocalDate fechaFin;

    private String observaciones;

    // Campos específicos para alojamiento
    private UUID habitacionId;

    // Campos específicos para senderos
    private UUID senderoId;
    private UUID guiaId;
    private TurnoSendero turno;

    // Usuario opcional (si está logueado)
    private UUID usuarioId;

    // Constructors
    public ReservaRequest() {}

    // Validation methods
    @AssertTrue(message = "Fecha de fin debe ser posterior a fecha de inicio")
    private boolean isFechaFinPosterior() {
        if (fechaInicio == null || fechaFin == null) {
            return true; // Let @NotNull handle null validation
        }
        return !fechaFin.isBefore(fechaInicio);
    }

    @AssertTrue(message = "Para reservas de alojamiento, habitación es obligatoria")
    private boolean isHabitacionValidaParaAlojamiento() {
        if (tipoReserva == TipoReserva.ALOJAMIENTO) {
            return habitacionId != null;
        }
        return true;
    }

    @AssertTrue(message = "Para reservas de sendero, sendero, guía y turno son obligatorios")
    private boolean isSenderoValidoParaSendero() {
        if (tipoReserva == TipoReserva.SENDERO) {
            return senderoId != null && guiaId != null && turno != null;
        }
        return true;
    }

    // Factory methods para crear requests específicos
    public static ReservaRequest alojamiento(String emailContacto, String nombreContacto, 
                                           Integer numeroPersonas, LocalDate fechaInicio, 
                                           LocalDate fechaFin, UUID habitacionId) {
        ReservaRequest request = new ReservaRequest();
        request.tipoReserva = TipoReserva.ALOJAMIENTO;
        request.emailContacto = emailContacto;
        request.nombreContacto = nombreContacto;
        request.numeroPersonas = numeroPersonas;
        request.fechaInicio = fechaInicio;
        request.fechaFin = fechaFin;
        request.habitacionId = habitacionId;
        return request;
    }

    public static ReservaRequest sendero(String emailContacto, String nombreContacto, 
                                       Integer numeroPersonas, LocalDate fechaInicio, 
                                       LocalDate fechaFin, UUID senderoId, UUID guiaId, 
                                       TurnoSendero turno) {
        ReservaRequest request = new ReservaRequest();
        request.tipoReserva = TipoReserva.SENDERO;
        request.emailContacto = emailContacto;
        request.nombreContacto = nombreContacto;
        request.numeroPersonas = numeroPersonas;
        request.fechaInicio = fechaInicio;
        request.fechaFin = fechaFin;
        request.senderoId = senderoId;
        request.guiaId = guiaId;
        request.turno = turno;
        return request;
    }

    // Getters and Setters
    public TipoReserva getTipoReserva() { return tipoReserva; }
    public void setTipoReserva(TipoReserva tipoReserva) { this.tipoReserva = tipoReserva; }

    public String getEmailContacto() { return emailContacto; }
    public void setEmailContacto(String emailContacto) { this.emailContacto = emailContacto; }

    public String getNombreContacto() { return nombreContacto; }
    public void setNombreContacto(String nombreContacto) { this.nombreContacto = nombreContacto; }

    public String getTelefonoContacto() { return telefonoContacto; }
    public void setTelefonoContacto(String telefonoContacto) { this.telefonoContacto = telefonoContacto; }

    public Integer getNumeroPersonas() { return numeroPersonas; }
    public void setNumeroPersonas(Integer numeroPersonas) { this.numeroPersonas = numeroPersonas; }

    public LocalDate getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDate fechaInicio) { this.fechaInicio = fechaInicio; }

    public LocalDate getFechaFin() { return fechaFin; }
    public void setFechaFin(LocalDate fechaFin) { this.fechaFin = fechaFin; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public UUID getHabitacionId() { return habitacionId; }
    public void setHabitacionId(UUID habitacionId) { this.habitacionId = habitacionId; }

    public UUID getSenderoId() { return senderoId; }
    public void setSenderoId(UUID senderoId) { this.senderoId = senderoId; }

    public UUID getGuiaId() { return guiaId; }
    public void setGuiaId(UUID guiaId) { this.guiaId = guiaId; }

    public TurnoSendero getTurno() { return turno; }
    public void setTurno(TurnoSendero turno) { this.turno = turno; }

    public UUID getUsuarioId() { return usuarioId; }
    public void setUsuarioId(UUID usuarioId) { this.usuarioId = usuarioId; }
}
