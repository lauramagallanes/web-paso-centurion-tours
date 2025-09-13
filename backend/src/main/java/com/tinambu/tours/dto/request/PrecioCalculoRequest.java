package com.tinambu.tours.dto.request;

import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.util.UUID;

public class PrecioCalculoRequest {
    
    @NotNull(message = "ID del sendero es obligatorio")
    private UUID senderoId;
    
    @NotNull(message = "Número de adultos es obligatorio")
    @Min(value = 1, message = "Debe haber al menos 1 adulto")
    @Max(value = 20, message = "Máximo 20 adultos por grupo")
    private Integer adultos;
    
    @NotNull(message = "Número de niños es obligatorio")
    @Min(value = 0, message = "Número de niños no puede ser negativo")
    @Max(value = 20, message = "Máximo 20 niños por grupo")
    private Integer ninos;
    
    @NotNull(message = "Fecha de inicio es obligatoria")
    @Future(message = "La fecha de inicio debe ser futura")
    private LocalDate fechaInicio;
    
    @NotNull(message = "Fecha de fin es obligatoria")
    private LocalDate fechaFin;

    // Constructors
    public PrecioCalculoRequest() {}

    public PrecioCalculoRequest(UUID senderoId, Integer adultos, Integer ninos, 
                               LocalDate fechaInicio, LocalDate fechaFin) {
        this.senderoId = senderoId;
        this.adultos = adultos;
        this.ninos = ninos;
        this.fechaInicio = fechaInicio;
        this.fechaFin = fechaFin;
    }

    // Validation method
    public void validate() {
        if (fechaFin != null && fechaInicio != null && fechaFin.isBefore(fechaInicio)) {
            throw new IllegalArgumentException("Fecha de fin debe ser posterior a fecha de inicio");
        }
        
        if (adultos + ninos > 20) {
            throw new IllegalArgumentException("El grupo no puede superar las 20 personas");
        }
        
        if (adultos == 0 && ninos > 0) {
            throw new IllegalArgumentException("Debe haber al menos un adulto para reservar");
        }
    }

    // Business methods
    public Integer getTotalPersonas() {
        return (adultos != null ? adultos : 0) + (ninos != null ? ninos : 0);
    }

    public boolean tieneNinos() {
        return ninos != null && ninos > 0;
    }

    public boolean esGrupoGrande() {
        return getTotalPersonas() > 10;
    }

    // Getters and Setters
    public UUID getSenderoId() {
        return senderoId;
    }

    public void setSenderoId(UUID senderoId) {
        this.senderoId = senderoId;
    }

    public Integer getAdultos() {
        return adultos;
    }

    public void setAdultos(Integer adultos) {
        this.adultos = adultos;
    }

    public Integer getNinos() {
        return ninos;
    }

    public void setNinos(Integer ninos) {
        this.ninos = ninos;
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

    @Override
    public String toString() {
        return "PrecioCalculoRequest{" +
                "senderoId=" + senderoId +
                ", adultos=" + adultos +
                ", ninos=" + ninos +
                ", fechaInicio=" + fechaInicio +
                ", fechaFin=" + fechaFin +
                ", totalPersonas=" + getTotalPersonas() +
                '}';
    }
}
