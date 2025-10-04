package com.tinambu.tours.entity.reserva;

import com.tinambu.tours.entity.alojamiento.Alojamiento;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Entity
@Table(name = "alojamiento_reservas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
@PrimaryKeyJoinColumn(name = "id")
public class AlojamientoReserva extends Reserva {

    @Column(name = "alojamiento_id", nullable = false)
    private UUID alojamientoId;

    @Column(name = "fecha_check_in", nullable = false)
    private LocalDate fechaCheckIn;

    @Column(name = "fecha_check_out", nullable = false)
    private LocalDate fechaCheckOut;

    @Column(name = "numero_noches")
    private Integer numeroNoches;

    @Column(name = "numero_huespedes", nullable = false)
    private Integer numeroHuespedes;

    @Column(name = "observaciones_especiales", columnDefinition = "TEXT")
    private String observacionesEspeciales;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alojamiento_id", insertable = false, updatable = false)
    private Alojamiento alojamiento;

    @PrePersist
    @PreUpdate
    protected void calcularNoches() {
        if (fechaCheckIn != null && fechaCheckOut != null) {
            this.numeroNoches = (int) ChronoUnit.DAYS.between(fechaCheckIn, fechaCheckOut);
        }
    }

    // Business Methods
    public int calcularNumeroNoches() {
        if (fechaCheckIn == null || fechaCheckOut == null) {
            return 0;
        }
        return (int) ChronoUnit.DAYS.between(fechaCheckIn, fechaCheckOut);
    }

    public boolean validarFechas() {
        if (fechaCheckIn == null || fechaCheckOut == null) {
            return false;
        }
        return fechaCheckIn.isBefore(fechaCheckOut);
    }

    @Override
    public BigDecimal calcularPrecioTotal() {
        if (alojamiento == null) {
            return super.getPrecioTotal();
        }
        
        int noches = calcularNumeroNoches();
        if (noches <= 0) {
            return BigDecimal.ZERO;
        }
        
        return alojamiento.calcularPrecioTotal(noches, numeroHuespedes);
    }

    public boolean estaEnRango(LocalDate fecha) {
        return !fecha.isBefore(fechaCheckIn) && fecha.isBefore(fechaCheckOut);
    }

    public boolean seSolapaCon(LocalDate checkIn, LocalDate checkOut) {
        return !(fechaCheckOut.isBefore(checkIn) || fechaCheckIn.isAfter(checkOut));
    }

    public boolean esValidaParaAlojamiento(Alojamiento alojamiento) {
        return validarFechas() && 
               alojamiento.puedeAcomodar(numeroHuespedes) &&
               numeroNoches > 0;
    }

    public long getDiasHastaCheckIn() {
        return ChronoUnit.DAYS.between(LocalDate.now(), fechaCheckIn);
    }

    public long getDiasDesdeCheckOut() {
        return ChronoUnit.DAYS.between(fechaCheckOut, LocalDate.now());
    }

    public boolean estaActiva() {
        LocalDate hoy = LocalDate.now();
        return !hoy.isBefore(fechaCheckIn) && hoy.isBefore(fechaCheckOut);
    }
}