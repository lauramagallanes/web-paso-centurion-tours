package com.tinambu.tours.entity.sendero;

import com.tinambu.tours.entity.guia.Guia;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "sendero_disponibilidad_guias")
public class SenderoDisponibilidadGuia {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(
        name = "UUID",
        strategy = "org.hibernate.id.UUIDGenerator"
    )
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "sendero_disponibilidad_id", nullable = false)
    private UUID senderoDisponibilidadId;

    @Column(name = "guia_id", nullable = false)
    private UUID guiaId;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    @CreationTimestamp
    @Column(name = "fecha_asignacion", nullable = false)
    private LocalDateTime fechaAsignacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sendero_disponibilidad_id", insertable = false, updatable = false)
    private SenderoDisponibilidad senderoDisponibilidad;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guia_id", insertable = false, updatable = false)
    private Guia guia;

    // Constructors
    public SenderoDisponibilidadGuia() {}

    public SenderoDisponibilidadGuia(UUID senderoDisponibilidadId, UUID guiaId) {
        this.senderoDisponibilidadId = senderoDisponibilidadId;
        this.guiaId = guiaId;
        this.activo = true;
    }

    // Business methods
    public void activar() {
        this.activo = true;
    }

    public void desactivar() {
        this.activo = false;
    }

    public boolean estaActivo() {
        return activo != null && activo;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getSenderoDisponibilidadId() {
        return senderoDisponibilidadId;
    }

    public void setSenderoDisponibilidadId(UUID senderoDisponibilidadId) {
        this.senderoDisponibilidadId = senderoDisponibilidadId;
    }

    public UUID getGuiaId() {
        return guiaId;
    }

    public void setGuiaId(UUID guiaId) {
        this.guiaId = guiaId;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    public LocalDateTime getFechaAsignacion() {
        return fechaAsignacion;
    }

    public void setFechaAsignacion(LocalDateTime fechaAsignacion) {
        this.fechaAsignacion = fechaAsignacion;
    }

    public SenderoDisponibilidad getSenderoDisponibilidad() {
        return senderoDisponibilidad;
    }

    public void setSenderoDisponibilidad(SenderoDisponibilidad senderoDisponibilidad) {
        this.senderoDisponibilidad = senderoDisponibilidad;
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
        if (!(o instanceof SenderoDisponibilidadGuia)) return false;
        SenderoDisponibilidadGuia that = (SenderoDisponibilidadGuia) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "SenderoDisponibilidadGuia{" +
                "id=" + id +
                ", senderoDisponibilidadId=" + senderoDisponibilidadId +
                ", guiaId=" + guiaId +
                ", activo=" + activo +
                '}';
    }
}
