package com.tinambu.tours.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class AlojamientoReservaRequest extends ReservaRequest {

    @NotNull(message = "El ID del alojamiento es obligatorio")
    private UUID alojamientoId;

    @NotNull(message = "La fecha de check-in es obligatoria")
    @Future(message = "La fecha de check-in debe ser futura")
    private LocalDate fechaCheckIn;

    @NotNull(message = "La fecha de check-out es obligatoria")
    @Future(message = "La fecha de check-out debe ser futura")
    private LocalDate fechaCheckOut;

    @NotNull(message = "El número de huéspedes es obligatorio")
    @Min(value = 1, message = "Debe haber al menos 1 huésped")
    @Max(value = 20, message = "No se pueden alojar más de 20 huéspedes")
    private Integer numeroHuespedes;

    @Size(max = 1000, message = "Las observaciones no pueden exceder 1000 caracteres")
    private String observacionesEspeciales;

    // Custom validation methods
    public boolean isFechasValidas() {
        return fechaCheckIn != null && fechaCheckOut != null && 
               fechaCheckIn.isBefore(fechaCheckOut);
    }

    public boolean isEstanciaMinima() {
        if (fechaCheckIn == null || fechaCheckOut == null) return false;
        return ChronoUnit.DAYS.between(fechaCheckIn, fechaCheckOut) >= 1;
    }

    public boolean isEstanciaMaxima() {
        if (fechaCheckIn == null || fechaCheckOut == null) return true;
        return ChronoUnit.DAYS.between(fechaCheckIn, fechaCheckOut) <= 30;
    }

    public int calcularNumeroNoches() {
        if (fechaCheckIn == null || fechaCheckOut == null) return 0;
        return (int) ChronoUnit.DAYS.between(fechaCheckIn, fechaCheckOut);
    }

    public boolean isReservaFutura() {
        LocalDate hoy = LocalDate.now();
        return fechaCheckIn != null && fechaCheckIn.isAfter(hoy);
    }

    public long getDiasHastaCheckIn() {
        LocalDate hoy = LocalDate.now();
        return fechaCheckIn != null ? ChronoUnit.DAYS.between(hoy, fechaCheckIn) : 0;
    }

    public String getValidationErrors() {
        StringBuilder errors = new StringBuilder();
        
        if (!isFechasValidas()) {
            errors.append("La fecha de check-in debe ser anterior a la de check-out. ");
        }
        
        if (!isEstanciaMinima()) {
            errors.append("La estancia mínima es de 1 noche. ");
        }
        
        if (!isEstanciaMaxima()) {
            errors.append("La estancia máxima es de 30 noches. ");
        }
        
        if (!isReservaFutura()) {
            errors.append("La reserva debe ser para fechas futuras. ");
        }
        
        return errors.toString().trim();
    }
}
