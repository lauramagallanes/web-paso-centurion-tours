package com.tinambu.tours.entity.sendero;

import com.tinambu.tours.entity.guia.Guia;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "sendero_disponibilidad")
public class SenderoDisponibilidad {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(
        name = "UUID",
        strategy = "org.hibernate.id.UUIDGenerator"
    )
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "sendero_id", nullable = false)
    private UUID senderoId;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin", nullable = false)
    private LocalDate fechaFin;

    @Column(name = "turno_manana", nullable = false)
    private Boolean turnoManana = false;

    @Column(name = "turno_tarde", nullable = false)
    private Boolean turnoTarde = false;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    @CreationTimestamp
    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    @UpdateTimestamp
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sendero_id", insertable = false, updatable = false)
    private Sendero sendero;

    @OneToMany(mappedBy = "senderoDisponibilidad", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<SenderoDisponibilidadGuia> guiasAsignados = new HashSet<>();

    // Constructors
    public SenderoDisponibilidad() {}

    public SenderoDisponibilidad(UUID senderoId, LocalDate fechaInicio, LocalDate fechaFin, 
                                Boolean turnoManana, Boolean turnoTarde) {
        this.senderoId = senderoId;
        this.fechaInicio = fechaInicio;
        this.fechaFin = fechaFin;
        this.turnoManana = turnoManana;
        this.turnoTarde = turnoTarde;
        this.activo = true;
    }

    // Business methods
    public boolean estaDisponibleEn(LocalDate fecha, TurnoSendero turno) {
        if (!activo) return false;
        if (fecha.isBefore(fechaInicio) || fecha.isAfter(fechaFin)) return false;
        
        return switch (turno) {
            case MANANA -> turnoManana;
            case TARDE -> turnoTarde;
        };
    }

    public boolean incluyeFecha(LocalDate fecha) {
        return !fecha.isBefore(fechaInicio) && !fecha.isAfter(fechaFin);
    }

    public boolean seSolapaCon(LocalDate inicio, LocalDate fin) {
        return !fin.isBefore(fechaInicio) && !inicio.isAfter(fechaFin);
    }

    public void asignarGuia(Guia guia) {
        SenderoDisponibilidadGuia assignment = new SenderoDisponibilidadGuia();
        assignment.setSenderoDisponibilidadId(this.id);
        assignment.setGuiaId(guia.getId());
        assignment.setSenderoDisponibilidad(this);
        assignment.setActivo(true);
        
        this.guiasAsignados.add(assignment);
    }

    public void removerGuia(UUID guiaId) {
        this.guiasAsignados.removeIf(assignment -> 
            assignment.getGuiaId().equals(guiaId));
    }

    public List<UUID> obtenerGuiaIds() {
        return guiasAsignados.stream()
                .filter(SenderoDisponibilidadGuia::getActivo)
                .map(SenderoDisponibilidadGuia::getGuiaId)
                .toList();
    }

    public void activar() {
        this.activo = true;
    }

    public void desactivar() {
        this.activo = false;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getSenderoId() {
        return senderoId;
    }

    public void setSenderoId(UUID senderoId) {
        this.senderoId = senderoId;
    }

    public LocalDate getFechaInicio() {
        return fechaInicio;
    }

    public void setFechaInicio(LocalDate fechaInicio) {
        this.fechaInicio = fechaInicio;
    }

    public LocalDate getFechaFin() {
        return fechaFin;
    }

    public void setFechaFin(LocalDate fechaFin) {
        this.fechaFin = fechaFin;
    }

    public Boolean getTurnoManana() {
        return turnoManana;
    }

    public void setTurnoManana(Boolean turnoManana) {
        this.turnoManana = turnoManana;
    }

    public Boolean getTurnoTarde() {
        return turnoTarde;
    }

    public void setTurnoTarde(Boolean turnoTarde) {
        this.turnoTarde = turnoTarde;
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

    public LocalDateTime getFechaActualizacion() {
        return fechaActualizacion;
    }

    public void setFechaActualizacion(LocalDateTime fechaActualizacion) {
        this.fechaActualizacion = fechaActualizacion;
    }

    public Sendero getSendero() {
        return sendero;
    }

    public void setSendero(Sendero sendero) {
        this.sendero = sendero;
    }

    public Set<SenderoDisponibilidadGuia> getGuiasAsignados() {
        return guiasAsignados;
    }

    public void setGuiasAsignados(Set<SenderoDisponibilidadGuia> guiasAsignados) {
        this.guiasAsignados = guiasAsignados;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof SenderoDisponibilidad)) return false;
        SenderoDisponibilidad that = (SenderoDisponibilidad) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "SenderoDisponibilidad{" +
                "id=" + id +
                ", senderoId=" + senderoId +
                ", fechaInicio=" + fechaInicio +
                ", fechaFin=" + fechaFin +
                ", turnoManana=" + turnoManana +
                ", turnoTarde=" + turnoTarde +
                ", activo=" + activo +
                '}';
    }
}
