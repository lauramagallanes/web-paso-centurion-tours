package com.tinambu.tours.entity.sendero;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Bloqueo puntual de fechas para un sendero.
 * Si turno == null, bloquea ambos turnos en el rango.
 * Si turno != null, bloquea solo ese turno.
 */
@Entity
@Table(name = "sendero_bloqueo")
public class SenderoBloqueo {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "sendero_id", nullable = false)
    private UUID senderoId;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin", nullable = false)
    private LocalDate fechaFin;

    /** null => bloquea ambos turnos. */
    @Column(name = "turno")
    @Enumerated(EnumType.STRING)
    private TurnoSendero turno;

    @Column(name = "motivo", length = 255)
    private String motivo;

    @CreationTimestamp
    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    public SenderoBloqueo() {}

    public SenderoBloqueo(UUID senderoId, LocalDate fechaInicio, LocalDate fechaFin,
                          TurnoSendero turno, String motivo) {
        this.senderoId = senderoId;
        this.fechaInicio = fechaInicio;
        this.fechaFin = fechaFin;
        this.turno = turno;
        this.motivo = motivo;
    }

    /** True si el bloqueo cubre la combinación dada. */
    public boolean cubre(LocalDate fecha, TurnoSendero turnoSolicitado) {
        if (fecha.isBefore(fechaInicio) || fecha.isAfter(fechaFin)) return false;
        return turno == null || turno == turnoSolicitado;
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

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }
}
