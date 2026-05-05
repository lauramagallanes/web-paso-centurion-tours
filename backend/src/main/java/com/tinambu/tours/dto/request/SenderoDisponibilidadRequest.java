package com.tinambu.tours.dto.request;

import com.tinambu.tours.entity.sendero.TurnoSendero;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/**
 * DTO de request admin para crear/editar una ventana de disponibilidad de sendero.
 */
public class SenderoDisponibilidadRequest {

    @NotNull(message = "Fecha de inicio es obligatoria")
    private LocalDate fechaInicio;

    @NotNull(message = "Fecha de fin es obligatoria")
    private LocalDate fechaFin;

    @NotNull(message = "Turno es obligatorio")
    private TurnoSendero turno;

    /**
     * CSV de días de semana (LUNES,MARTES,...). null o vacío = todos los días.
     */
    private String diasSemana;

    /** Si null, se asume true (activa). */
    private Boolean activo;

    public SenderoDisponibilidadRequest() {}

    public LocalDate getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDate fechaInicio) { this.fechaInicio = fechaInicio; }

    public LocalDate getFechaFin() { return fechaFin; }
    public void setFechaFin(LocalDate fechaFin) { this.fechaFin = fechaFin; }

    public TurnoSendero getTurno() { return turno; }
    public void setTurno(TurnoSendero turno) { this.turno = turno; }

    public String getDiasSemana() { return diasSemana; }
    public void setDiasSemana(String diasSemana) { this.diasSemana = diasSemana; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
}
