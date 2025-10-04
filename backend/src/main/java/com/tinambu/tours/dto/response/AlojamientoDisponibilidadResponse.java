package com.tinambu.tours.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlojamientoDisponibilidadResponse {

    private UUID id;
    private UUID alojamientoId;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private Boolean activo;
    
    @Builder.Default
    private List<LocalDate> fechasDisponibles = new ArrayList<>();
    
    @Builder.Default
    private List<LocalDate> fechasBloqueadas = new ArrayList<>();

    // Business methods
    public long getDuracionEnDias() {
        if (fechaInicio == null || fechaFin == null) return 0;
        return fechaInicio.until(fechaFin).getDays() + 1;
    }

    public boolean contieneRango(LocalDate checkIn, LocalDate checkOut) {
        return !fechaInicio.isAfter(checkIn) && !fechaFin.isBefore(checkOut);
    }

    public boolean estaEnRango(LocalDate fecha) {
        return !fecha.isBefore(fechaInicio) && !fecha.isAfter(fechaFin);
    }

    public List<LocalDate> generarFechasEnRango() {
        List<LocalDate> fechas = new ArrayList<>();
        LocalDate fecha = fechaInicio;
        while (!fecha.isAfter(fechaFin)) {
            fechas.add(fecha);
            fecha = fecha.plusDays(1);
        }
        return fechas;
    }

    public boolean tieneDisponibilidad() {
        return fechasDisponibles != null && !fechasDisponibles.isEmpty();
    }

    public boolean estaBloqueado() {
        return fechasBloqueadas != null && !fechasBloqueadas.isEmpty();
    }

    public int getCantidadFechasDisponibles() {
        return fechasDisponibles != null ? fechasDisponibles.size() : 0;
    }

    public int getCantidadFechasBloqueadas() {
        return fechasBloqueadas != null ? fechasBloqueadas.size() : 0;
    }

    public String getResumenDisponibilidad() {
        return fechaInicio + " al " + fechaFin + 
               " (" + getDuracionEnDias() + " días)";
    }

    public boolean esRangoFuturo() {
        return fechaFin.isAfter(LocalDate.now());
    }

    public boolean esRangoActivo() {
        LocalDate hoy = LocalDate.now();
        return !fechaFin.isBefore(hoy) && activo;
    }
}
