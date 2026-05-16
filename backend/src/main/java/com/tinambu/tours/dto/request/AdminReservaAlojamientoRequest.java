package com.tinambu.tours.dto.request;

import com.tinambu.tours.entity.reserva.EstadoReserva;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * Request used by an admin to manually create an alojamiento reservation on behalf of a customer.
 * Allows same-day check-in (no @Future restriction).
 */
public class AdminReservaAlojamientoRequest {

    @NotBlank(message = "Email de contacto es obligatorio")
    @Email(message = "Email debe tener formato válido")
    private String emailContacto;

    @NotBlank(message = "Nombre de contacto es obligatorio")
    private String nombreContacto;

    private String telefonoContacto;

    private String observaciones;

    @NotNull(message = "Alojamiento es obligatorio")
    private UUID alojamientoId;

    @NotNull(message = "La fecha de check-in es obligatoria")
    @FutureOrPresent(message = "La fecha de check-in no puede ser pasada")
    private LocalDate fechaCheckIn;

    @NotNull(message = "La fecha de check-out es obligatoria")
    @FutureOrPresent(message = "La fecha de check-out no puede ser pasada")
    private LocalDate fechaCheckOut;

    @NotNull(message = "El número de huéspedes es obligatorio")
    @Min(value = 1, message = "Debe haber al menos 1 huésped")
    @Max(value = 20, message = "No se pueden alojar más de 20 huéspedes")
    private Integer numeroHuespedes;

    @Size(max = 1000, message = "Las observaciones no pueden exceder 1000 caracteres")
    private String observacionesEspeciales;

    /** Estado inicial de la reserva (CONFIRMADA o PENDIENTE). Default: PENDIENTE. */
    private EstadoReserva estadoInicial = EstadoReserva.PENDIENTE;

    public AdminReservaAlojamientoRequest() {}

    public boolean isFechasValidas() {
        return fechaCheckIn != null && fechaCheckOut != null
                && fechaCheckIn.isBefore(fechaCheckOut);
    }

    public int calcularNumeroNoches() {
        if (fechaCheckIn == null || fechaCheckOut == null) return 0;
        return (int) ChronoUnit.DAYS.between(fechaCheckIn, fechaCheckOut);
    }

    public String getValidationErrors() {
        StringBuilder errors = new StringBuilder();
        if (!isFechasValidas()) {
            errors.append("La fecha de check-in debe ser anterior a la de check-out. ");
        }
        if (calcularNumeroNoches() > 30) {
            errors.append("La estancia máxima es de 30 noches. ");
        }
        return errors.toString().trim();
    }

    public String getEmailContacto() { return emailContacto; }
    public void setEmailContacto(String emailContacto) { this.emailContacto = emailContacto; }

    public String getNombreContacto() { return nombreContacto; }
    public void setNombreContacto(String nombreContacto) { this.nombreContacto = nombreContacto; }

    public String getTelefonoContacto() { return telefonoContacto; }
    public void setTelefonoContacto(String telefonoContacto) { this.telefonoContacto = telefonoContacto; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public UUID getAlojamientoId() { return alojamientoId; }
    public void setAlojamientoId(UUID alojamientoId) { this.alojamientoId = alojamientoId; }

    public LocalDate getFechaCheckIn() { return fechaCheckIn; }
    public void setFechaCheckIn(LocalDate fechaCheckIn) { this.fechaCheckIn = fechaCheckIn; }

    public LocalDate getFechaCheckOut() { return fechaCheckOut; }
    public void setFechaCheckOut(LocalDate fechaCheckOut) { this.fechaCheckOut = fechaCheckOut; }

    public Integer getNumeroHuespedes() { return numeroHuespedes; }
    public void setNumeroHuespedes(Integer numeroHuespedes) { this.numeroHuespedes = numeroHuespedes; }

    public String getObservacionesEspeciales() { return observacionesEspeciales; }
    public void setObservacionesEspeciales(String observacionesEspeciales) { this.observacionesEspeciales = observacionesEspeciales; }

    public EstadoReserva getEstadoInicial() { return estadoInicial; }
    public void setEstadoInicial(EstadoReserva estadoInicial) { this.estadoInicial = estadoInicial; }
}
