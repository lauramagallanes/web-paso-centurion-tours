package com.tinambu.tours.dto.request;

import com.tinambu.tours.entity.reserva.EstadoReserva;
import com.tinambu.tours.entity.sendero.TurnoSendero;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Request used by an admin to manually create a sendero reservation on behalf of a customer
 * (e.g. walk-in or phone booking). Skips the lead-time restriction enforced for the public flow.
 */
public class AdminReservaSenderoRequest {

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
    @FutureOrPresent(message = "La fecha de inicio no puede ser pasada")
    private LocalDate fechaInicio;

    @NotNull(message = "Sendero es obligatorio")
    private UUID senderoId;

    @NotNull(message = "Turno es obligatorio")
    private TurnoSendero turno;

    /** Optional. If null, the system will auto-assign an available guide. */
    private UUID guiaId;

    private String observaciones;

    /** Estado inicial de la reserva (CONFIRMADA o PENDIENTE). Default: PENDIENTE. */
    private EstadoReserva estadoInicial = EstadoReserva.PENDIENTE;

    public AdminReservaSenderoRequest() {}

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

    public UUID getSenderoId() { return senderoId; }
    public void setSenderoId(UUID senderoId) { this.senderoId = senderoId; }

    public TurnoSendero getTurno() { return turno; }
    public void setTurno(TurnoSendero turno) { this.turno = turno; }

    public UUID getGuiaId() { return guiaId; }
    public void setGuiaId(UUID guiaId) { this.guiaId = guiaId; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public EstadoReserva getEstadoInicial() { return estadoInicial; }
    public void setEstadoInicial(EstadoReserva estadoInicial) { this.estadoInicial = estadoInicial; }
}
