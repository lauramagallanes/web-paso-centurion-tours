package com.tinambu.tours.dto.response;

import com.tinambu.tours.entity.sendero.TurnoSendero;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Vista pública/admin de un bloqueo. Tanto el calendario público como el panel admin
 * la consumen; no expone datos sensibles.
 */
public class SenderoBloqueoResponse {

    private UUID id;
    private UUID senderoId;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private TurnoSendero turno; // null = ambos turnos
    private String motivo;

    public SenderoBloqueoResponse() {}

    public SenderoBloqueoResponse(UUID id, UUID senderoId, LocalDate fechaInicio, LocalDate fechaFin,
                                  TurnoSendero turno, String motivo) {
        this.id = id;
        this.senderoId = senderoId;
        this.fechaInicio = fechaInicio;
        this.fechaFin = fechaFin;
        this.turno = turno;
        this.motivo = motivo;
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

    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }
}
