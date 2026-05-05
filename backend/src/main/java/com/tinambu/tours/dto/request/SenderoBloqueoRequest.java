package com.tinambu.tours.dto.request;

import com.tinambu.tours.entity.sendero.TurnoSendero;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * DTO de request admin para crear un bloqueo de fechas en un sendero.
 * turno = null bloquea ambos turnos.
 */
public class SenderoBloqueoRequest {

    @NotNull(message = "Fecha de inicio es obligatoria")
    private LocalDate fechaInicio;

    @NotNull(message = "Fecha de fin es obligatoria")
    private LocalDate fechaFin;

    /** null = bloquea ambos turnos. */
    private TurnoSendero turno;

    @Size(max = 255)
    private String motivo;

    public SenderoBloqueoRequest() {}

    public LocalDate getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDate fechaInicio) { this.fechaInicio = fechaInicio; }

    public LocalDate getFechaFin() { return fechaFin; }
    public void setFechaFin(LocalDate fechaFin) { this.fechaFin = fechaFin; }

    public TurnoSendero getTurno() { return turno; }
    public void setTurno(TurnoSendero turno) { this.turno = turno; }

    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }
}
