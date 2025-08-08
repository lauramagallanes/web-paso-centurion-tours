package com.tinambu.tours.entity.reserva;

import com.tinambu.tours.entity.habitacion.Habitacion;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@DiscriminatorValue("ALOJAMIENTO")
public class AlojamientoReserva extends Reserva {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "habitacion_id", nullable = false)
    @NotNull(message = "Habitación es obligatoria para reserva de alojamiento")
    private Habitacion habitacion;

    @Column(name = "numero_noches", nullable = false)
    private Integer numeroNoches;

    // Constructors
    public AlojamientoReserva() {
        super();
    }

    public AlojamientoReserva(String emailContacto, String nombreContacto, Integer numeroPersonas,
                             LocalDate fechaInicio, LocalDate fechaFin, Habitacion habitacion) {
        super(emailContacto, nombreContacto, numeroPersonas, fechaInicio, fechaFin);
        this.habitacion = habitacion;
        this.numeroNoches = calcularNumeroNoches();
        this.setPrecioTotal(calcularPrecioTotal());
    }

    @Override
    public TipoReserva getTipoReserva() {
        return TipoReserva.ALOJAMIENTO;
    }

    @Override
    public void validarReserva() {
        // Validar capacidad de habitación
        if (!habitacion.puedeAcomodar(getNumeroPersonas())) {
            throw new IllegalArgumentException(
                String.format("Habitación %s no puede acomodar %d personas (capacidad: %d-%d)",
                    habitacion.getNumero(), getNumeroPersonas(), 
                    habitacion.getCapacidadMinima(), habitacion.getCapacidadMaxima())
            );
        }

        // Validar fechas
        if (getFechaInicio().isAfter(getFechaFin())) {
            throw new IllegalArgumentException("Fecha de inicio debe ser anterior a fecha de fin");
        }

        if (getFechaInicio().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Fecha de inicio no puede ser en el pasado");
        }

        // Validar mínimo una noche
        if (numeroNoches < 1) {
            throw new IllegalArgumentException("Reserva de alojamiento debe ser mínimo una noche");
        }
    }

    @Override
    public BigDecimal calcularPrecioTotal() {
        if (habitacion == null || numeroNoches == null) {
            return BigDecimal.ZERO;
        }
        return habitacion.calcularPrecioTotal(getNumeroPersonas(), numeroNoches);
    }

    // Business Methods
    private int calcularNumeroNoches() {
        return (int) (getFechaFin().toEpochDay() - getFechaInicio().toEpochDay());
    }

    public boolean bloqueaHabitacionCompletamente() {
        return true; // Las reservas de alojamiento bloquean la habitación completamente
    }

    @PostLoad
    @PostPersist
    @PostUpdate
    public void calcularNoches() {
        if (getFechaInicio() != null && getFechaFin() != null) {
            this.numeroNoches = calcularNumeroNoches();
        }
    }

    // Getters and Setters
    public Habitacion getHabitacion() { return habitacion; }
    public void setHabitacion(Habitacion habitacion) { 
        this.habitacion = habitacion; 
        if (getFechaInicio() != null && getFechaFin() != null) {
            this.numeroNoches = calcularNumeroNoches();
            this.setPrecioTotal(calcularPrecioTotal());
        }
    }

    public Integer getNumeroNoches() { return numeroNoches; }
    public void setNumeroNoches(Integer numeroNoches) { this.numeroNoches = numeroNoches; }
}
