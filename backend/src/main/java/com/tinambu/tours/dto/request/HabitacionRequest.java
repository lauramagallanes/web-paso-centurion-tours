package com.tinambu.tours.dto.request;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

/**
 * DTO de request para crear/actualizar habitaciones
 * Contiene validaciones y solo los campos que pueden ser modificados por el usuario
 */
public class HabitacionRequest {

    @NotBlank(message = "Número de habitación es obligatorio")
    private String numero;

    @NotBlank(message = "Nombre de habitación es obligatorio")
    private String nombre;

    private String descripcion;

    @NotNull(message = "Capacidad mínima es obligatoria")
    @Min(value = 1, message = "Capacidad mínima debe ser al menos 1")
    private Integer capacidadMinima;

    @NotNull(message = "Capacidad máxima es obligatoria")
    @Min(value = 1, message = "Capacidad máxima debe ser al menos 1")
    private Integer capacidadMaxima;

    @NotNull(message = "Precio por persona por noche es obligatorio")
    @DecimalMin(value = "0.0", inclusive = false, message = "Precio debe ser mayor a 0")
    private BigDecimal precioPorPersonaNoche;

    private String urlImagen;

    // Constructors
    public HabitacionRequest() {}

    // Custom validation
    @AssertTrue(message = "Capacidad máxima debe ser mayor o igual a capacidad mínima")
    private boolean isCapacidadMaximaMayorQueMinima() {
        if (capacidadMinima == null || capacidadMaxima == null) {
            return true; // Let @NotNull handle null validation
        }
        return capacidadMaxima >= capacidadMinima;
    }

    // Getters and Setters
    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public Integer getCapacidadMinima() { return capacidadMinima; }
    public void setCapacidadMinima(Integer capacidadMinima) { this.capacidadMinima = capacidadMinima; }

    public Integer getCapacidadMaxima() { return capacidadMaxima; }
    public void setCapacidadMaxima(Integer capacidadMaxima) { this.capacidadMaxima = capacidadMaxima; }

    public BigDecimal getPrecioPorPersonaNoche() { return precioPorPersonaNoche; }
    public void setPrecioPorPersonaNoche(BigDecimal precioPorPersonaNoche) { this.precioPorPersonaNoche = precioPorPersonaNoche; }

    public String getUrlImagen() { return urlImagen; }
    public void setUrlImagen(String urlImagen) { this.urlImagen = urlImagen; }
}
