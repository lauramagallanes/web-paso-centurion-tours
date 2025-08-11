package com.tinambu.tours.dto.response;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO de respuesta para habitaciones
 * Expone solo la información pública necesaria para el frontend
 */
public class HabitacionResponse {
    
    private UUID id;
    private String numero;
    private String nombre;
    private String descripcion;
    private Integer capacidadMinima;
    private Integer capacidadMaxima;
    private BigDecimal precioPorPersonaNoche;
    private String urlImagen;

    // Constructors
    public HabitacionResponse() {}

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

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
