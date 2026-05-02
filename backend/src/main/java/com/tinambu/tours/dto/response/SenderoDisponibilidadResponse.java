package com.tinambu.tours.dto.response;

import com.tinambu.tours.entity.sendero.TurnoSendero;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Public-safe view of a SenderoDisponibilidad window.
 * Used by the frontend calendar to know which dates/turnos are bookable.
 */
public class SenderoDisponibilidadResponse {

    private UUID id;
    private UUID senderoId;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private TurnoSendero turno;
    private String diasSemana;
    private Integer cuposTotal;
    private Boolean activo;

    public SenderoDisponibilidadResponse() {}

    public SenderoDisponibilidadResponse(UUID id, UUID senderoId, LocalDate fechaInicio, LocalDate fechaFin,
                                         TurnoSendero turno, String diasSemana, Integer cuposTotal, Boolean activo) {
        this.id = id;
        this.senderoId = senderoId;
        this.fechaInicio = fechaInicio;
        this.fechaFin = fechaFin;
        this.turno = turno;
        this.diasSemana = diasSemana;
        this.cuposTotal = cuposTotal;
        this.activo = activo;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getSenderoId() { return senderoId; }
    public void setSenderoId(UUID senderoId) { this.senderoId = senderoId; }

    public LocalDate getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDate fechaInicio) { this.fechaInicio = fechaInicio; }

    public LocalDate getFechaFin() { return fechaFin; }
    public void setFechaFin(LocalDate fechaFin) { this.fechaFin = fechaFin; }

    public TurnoSendero getTurno() { return turno; }
    public void setTurno(TurnoSendero turno) { this.turno = turno; }

    public String getDiasSemana() { return diasSemana; }
    public void setDiasSemana(String diasSemana) { this.diasSemana = diasSemana; }

    public Integer getCuposTotal() { return cuposTotal; }
    public void setCuposTotal(Integer cuposTotal) { this.cuposTotal = cuposTotal; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
}
