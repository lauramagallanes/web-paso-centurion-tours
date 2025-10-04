package com.tinambu.tours.dto.request;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalTime;

public class AlojamientoRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 255, message = "El nombre no puede exceder 255 caracteres")
    private String nombre;

    @Size(max = 2000, message = "La descripción no puede exceder 2000 caracteres")
    private String descripcion;

    @Size(max = 500, message = "La ubicación no puede exceder 500 caracteres")
    private String ubicacion;

    @NotNull(message = "La capacidad mínima es obligatoria")
    @Min(value = 1, message = "La capacidad mínima debe ser al menos 1")
    @Max(value = 20, message = "La capacidad mínima no puede exceder 20")
    private Integer capacidadMinima;

    @NotNull(message = "La capacidad máxima es obligatoria")
    @Min(value = 1, message = "La capacidad máxima debe ser al menos 1")
    @Max(value = 20, message = "La capacidad máxima no puede exceder 20")
    private Integer capacidadMaxima;

    @Min(value = 0, message = "La cantidad de camas dobles no puede ser negativa")
    @Max(value = 10, message = "La cantidad de camas dobles no puede exceder 10")
    private Integer cantidadCamasDobles = 0;

    @Min(value = 0, message = "La cantidad de literas no puede ser negativa")
    @Max(value = 10, message = "La cantidad de literas no puede exceder 10")
    private Integer cantidadLiteras = 0;

    @NotNull(message = "La hora de llegada es obligatoria")
    private LocalTime horaLlegada;

    @NotNull(message = "La hora de salida es obligatoria")
    private LocalTime horaSalida;

    @NotNull(message = "El precio por noche es obligatorio")
    @DecimalMin(value = "0.01", message = "El precio por noche debe ser mayor a 0")
    @DecimalMax(value = "999999.99", message = "El precio por noche no puede exceder 999,999.99")
    private BigDecimal precioPorNoche;

    // Constructors
    public AlojamientoRequest() {}

    public AlojamientoRequest(String nombre, String descripcion, String ubicacion, 
                              Integer capacidadMinima, Integer capacidadMaxima,
                              Integer cantidadCamasDobles, Integer cantidadLiteras,
                              LocalTime horaLlegada, LocalTime horaSalida, BigDecimal precioPorNoche) {
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.ubicacion = ubicacion;
        this.capacidadMinima = capacidadMinima;
        this.capacidadMaxima = capacidadMaxima;
        this.cantidadCamasDobles = cantidadCamasDobles;
        this.cantidadLiteras = cantidadLiteras;
        this.horaLlegada = horaLlegada;
        this.horaSalida = horaSalida;
        this.precioPorNoche = precioPorNoche;
    }

    // Getters and Setters
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public String getUbicacion() { return ubicacion; }
    public void setUbicacion(String ubicacion) { this.ubicacion = ubicacion; }

    public Integer getCapacidadMinima() { return capacidadMinima; }
    public void setCapacidadMinima(Integer capacidadMinima) { this.capacidadMinima = capacidadMinima; }

    public Integer getCapacidadMaxima() { return capacidadMaxima; }
    public void setCapacidadMaxima(Integer capacidadMaxima) { this.capacidadMaxima = capacidadMaxima; }

    public Integer getCantidadCamasDobles() { return cantidadCamasDobles; }
    public void setCantidadCamasDobles(Integer cantidadCamasDobles) { this.cantidadCamasDobles = cantidadCamasDobles; }

    public Integer getCantidadLiteras() { return cantidadLiteras; }
    public void setCantidadLiteras(Integer cantidadLiteras) { this.cantidadLiteras = cantidadLiteras; }

    public LocalTime getHoraLlegada() { return horaLlegada; }
    public void setHoraLlegada(LocalTime horaLlegada) { this.horaLlegada = horaLlegada; }

    public LocalTime getHoraSalida() { return horaSalida; }
    public void setHoraSalida(LocalTime horaSalida) { this.horaSalida = horaSalida; }

    public BigDecimal getPrecioPorNoche() { return precioPorNoche; }
    public void setPrecioPorNoche(BigDecimal precioPorNoche) { this.precioPorNoche = precioPorNoche; }

    // Custom validation methods
    public boolean isCapacidadValida() {
        return capacidadMinima != null && capacidadMaxima != null && 
               capacidadMinima <= capacidadMaxima;
    }

    public boolean isHorariosValidos() {
        return horaLlegada != null && horaSalida != null && 
               !horaLlegada.equals(horaSalida);
    }

    public boolean isConfiguracionCamasValida() {
        if (cantidadCamasDobles == null) cantidadCamasDobles = 0;
        if (cantidadLiteras == null) cantidadLiteras = 0;
        
        int capacidadCamas = (cantidadCamasDobles * 2) + (cantidadLiteras * 2);
        return capacidadMaxima != null && capacidadCamas >= capacidadMaxima;
    }

    public String getValidationErrors() {
        StringBuilder errors = new StringBuilder();
        
        if (!isCapacidadValida()) {
            errors.append("La capacidad mínima debe ser menor o igual a la máxima. ");
        }
        
        if (!isHorariosValidos()) {
            errors.append("Los horarios de llegada y salida deben ser diferentes. ");
        }
        
        if (!isConfiguracionCamasValida()) {
            errors.append("La configuración de camas debe permitir alojar la capacidad máxima. ");
        }
        
        return errors.toString().trim();
    }
}