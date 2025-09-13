package com.tinambu.tours.entity.guia;

import com.tinambu.tours.entity.sendero.TurnoSendero;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "guia_reserva_bloqueos", 
       indexes = {
           @Index(name = "idx_guia_fecha_turno", columnList = "guia_id, fecha, turno"),
           @Index(name = "idx_reserva_id", columnList = "reserva_id"),
           @Index(name = "idx_fecha_turno_activo", columnList = "fecha, turno, activo")
       })
public class GuiaReservaBloqueo {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(
        name = "UUID",
        strategy = "org.hibernate.id.UUIDGenerator"
    )
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "guia_id", nullable = false)
    private UUID guiaId;

    @Column(name = "reserva_id", nullable = false)
    private UUID reservaId;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @Enumerated(EnumType.STRING)
    @Column(name = "turno", nullable = false, length = 10)
    private TurnoSendero turno;

    @Column(name = "sendero_reservado", length = 255)
    private String senderoReservado;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    @CreationTimestamp
    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guia_id", insertable = false, updatable = false)
    private Guia guia;

    // Constructors
    public GuiaReservaBloqueo() {}

    public GuiaReservaBloqueo(UUID guiaId, UUID reservaId, LocalDate fecha, 
                             TurnoSendero turno, String senderoReservado) {
        this.guiaId = guiaId;
        this.reservaId = reservaId;
        this.fecha = fecha;
        this.turno = turno;
        this.senderoReservado = senderoReservado;
        this.activo = true;
    }

    // Business methods
    public boolean estaActivoParaFecha(LocalDate fechaConsulta, TurnoSendero turnoConsulta) {
        return activo && 
               fecha.equals(fechaConsulta) && 
               turno.equals(turnoConsulta);
    }

    public void activar() {
        this.activo = true;
    }

    public void desactivar() {
        this.activo = false;
    }

    public String getDescripcionBloqueo() {
        return String.format("Bloqueado por reserva en %s - %s %s", 
                           senderoReservado, 
                           fecha.toString(), 
                           turno.getNombre());
    }

    public boolean esDelMismoTurno(TurnoSendero otroTurno) {
        return this.turno.equals(otroTurno);
    }

    public boolean esDelMismaFecha(LocalDate otraFecha) {
        return this.fecha.equals(otraFecha);
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getGuiaId() {
        return guiaId;
    }

    public void setGuiaId(UUID guiaId) {
        this.guiaId = guiaId;
    }

    public UUID getReservaId() {
        return reservaId;
    }

    public void setReservaId(UUID reservaId) {
        this.reservaId = reservaId;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public TurnoSendero getTurno() {
        return turno;
    }

    public void setTurno(TurnoSendero turno) {
        this.turno = turno;
    }

    public String getSenderoReservado() {
        return senderoReservado;
    }

    public void setSenderoReservado(String senderoReservado) {
        this.senderoReservado = senderoReservado;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public Guia getGuia() {
        return guia;
    }

    public void setGuia(Guia guia) {
        this.guia = guia;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof GuiaReservaBloqueo)) return false;
        GuiaReservaBloqueo that = (GuiaReservaBloqueo) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "GuiaReservaBloqueo{" +
                "id=" + id +
                ", guiaId=" + guiaId +
                ", reservaId=" + reservaId +
                ", fecha=" + fecha +
                ", turno=" + turno +
                ", senderoReservado='" + senderoReservado + '\'' +
                ", activo=" + activo +
                '}';
    }
}
