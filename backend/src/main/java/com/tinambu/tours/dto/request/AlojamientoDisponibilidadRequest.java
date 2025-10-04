package com.tinambu.tours.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlojamientoDisponibilidadRequest {

    @NotNull(message = "El ID del alojamiento es obligatorio")
    private UUID alojamientoId;

    @NotNull(message = "La fecha de inicio es obligatoria")
    private LocalDate fechaInicio;

    @NotNull(message = "La fecha de fin es obligatoria")
    private LocalDate fechaFin;

    // Custom validation methods
    public boolean isFechasValidas() {
        return fechaInicio != null && fechaFin != null && 
               fechaInicio.isBefore(fechaFin);
    }

    public boolean isFechasFuturas() {
        LocalDate hoy = LocalDate.now();
        return fechaInicio != null && fechaFin != null &&
               !fechaInicio.isBefore(hoy);
    }

    public long getDuracionEnDias() {
        if (fechaInicio == null || fechaFin == null) return 0;
        return fechaInicio.until(fechaFin).getDays() + 1;
    }

    public String getValidationErrors() {
        StringBuilder errors = new StringBuilder();
        
        if (!isFechasValidas()) {
            errors.append("La fecha de inicio debe ser anterior a la fecha de fin. ");
        }
        
        if (!isFechasFuturas()) {
            errors.append("Las fechas deben ser futuras (desde hoy en adelante). ");
        }
        
        return errors.toString().trim();
    }
}
