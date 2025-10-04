package com.tinambu.tours.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlojamientoPrecioCalculoRequest {

    @NotNull(message = "El ID del alojamiento es obligatorio")
    private UUID alojamientoId;

    @NotNull(message = "La fecha de check-in es obligatoria")
    private LocalDate fechaCheckIn;

    @NotNull(message = "La fecha de check-out es obligatoria")
    private LocalDate fechaCheckOut;

    @NotNull(message = "El número de huéspedes es obligatorio")
    @Min(value = 1, message = "Debe haber al menos 1 huésped")
    @Max(value = 20, message = "No se pueden alojar más de 20 huéspedes")
    private Integer numeroHuespedes;

    // Helper methods
    public int calcularNumeroNoches() {
        if (fechaCheckIn == null || fechaCheckOut == null) return 0;
        return (int) ChronoUnit.DAYS.between(fechaCheckIn, fechaCheckOut);
    }

    public boolean isFechasValidas() {
        return fechaCheckIn != null && fechaCheckOut != null && 
               fechaCheckIn.isBefore(fechaCheckOut);
    }

    public boolean isParametrosValidos() {
        return alojamientoId != null && 
               numeroHuespedes != null && numeroHuespedes > 0 &&
               isFechasValidas() && 
               calcularNumeroNoches() > 0;
    }

    public String getValidationErrors() {
        StringBuilder errors = new StringBuilder();
        
        if (alojamientoId == null) {
            errors.append("El ID del alojamiento es requerido. ");
        }
        
        if (numeroHuespedes == null || numeroHuespedes <= 0) {
            errors.append("El número de huéspedes debe ser mayor a 0. ");
        }
        
        if (!isFechasValidas()) {
            errors.append("Las fechas de check-in y check-out son requeridas y válidas. ");
        }
        
        if (calcularNumeroNoches() <= 0) {
            errors.append("La estancia debe ser de al menos 1 noche. ");
        }
        
        return errors.toString().trim();
    }
}
