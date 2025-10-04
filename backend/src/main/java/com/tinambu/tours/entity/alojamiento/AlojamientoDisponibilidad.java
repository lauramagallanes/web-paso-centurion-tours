package com.tinambu.tours.entity.alojamiento;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "alojamiento_disponibilidad")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = false)
public class AlojamientoDisponibilidad {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "alojamiento_id", nullable = false)
    private UUID alojamientoId;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin", nullable = false)
    private LocalDate fechaFin;

    @Builder.Default
    private Boolean activo = true;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alojamiento_id", insertable = false, updatable = false)
    private Alojamiento alojamiento;

    @PrePersist
    protected void onCreate() {
        fechaCreacion = LocalDateTime.now();
        fechaActualizacion = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        fechaActualizacion = LocalDateTime.now();
    }

    // Business Methods
    public boolean contieneRango(LocalDate checkIn, LocalDate checkOut) {
        return !fechaInicio.isAfter(checkIn) && !fechaFin.isBefore(checkOut);
    }

    public boolean contieneRangoCompleto(LocalDate checkIn, LocalDate checkOut) {
        return !fechaInicio.isAfter(checkIn) && !fechaFin.isBefore(checkOut);
    }

    public boolean contieneRangoExacto(LocalDate checkIn, LocalDate checkOut) {
        return fechaInicio.equals(checkIn) && fechaFin.equals(checkOut);
    }

    public boolean seSolapaCon(LocalDate checkIn, LocalDate checkOut) {
        return !(fechaFin.isBefore(checkIn) || fechaInicio.isAfter(checkOut));
    }

    public boolean seSolapaCon(AlojamientoDisponibilidad otra) {
        return seSolapaCon(otra.fechaInicio, otra.fechaFin);
    }

    public boolean esValidaParaRango(LocalDate checkIn, LocalDate checkOut) {
        return checkIn.isBefore(checkOut) && 
               contieneRangoCompleto(checkIn, checkOut) && 
               activo;
    }

    public long getDuracionEnDias() {
        return fechaInicio.until(fechaFin).getDays() + 1;
    }
}
