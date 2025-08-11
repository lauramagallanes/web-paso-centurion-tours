package com.tinambu.tours.dto.request;

import com.tinambu.tours.entity.sendero.NivelDificultad;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

/**
 * DTO de request para crear/actualizar senderos
 * Contiene validaciones y solo los campos que pueden ser modificados por el usuario
 */
public class SenderoRequest {

    @NotBlank(message = "Nombre del sendero es obligatorio")
    private String nombre;

    private String descripcion;

    @NotNull(message = "Duración en horas es obligatoria")
    @DecimalMin(value = "0.5", message = "Duración debe ser al menos 0.5 horas")
    private BigDecimal duracionHoras;

    @NotNull(message = "Nivel de dificultad es obligatorio")
    private NivelDificultad nivelDificultad;

    @NotNull(message = "Capacidad máxima del grupo es obligatoria")
    @Min(value = 1, message = "Capacidad máxima debe ser al menos 1")
    private Integer capacidadMaximaGrupo;

    @NotNull(message = "Precio por persona es obligatorio")
    @DecimalMin(value = "0.0", inclusive = false, message = "Precio debe ser mayor a 0")
    private BigDecimal precioPorPersona;

    private String urlImagen;

    // Constructors
    public SenderoRequest() {}

    // Getters and Setters
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public BigDecimal getDuracionHoras() { return duracionHoras; }
    public void setDuracionHoras(BigDecimal duracionHoras) { this.duracionHoras = duracionHoras; }

    public NivelDificultad getNivelDificultad() { return nivelDificultad; }
    public void setNivelDificultad(NivelDificultad nivelDificultad) { this.nivelDificultad = nivelDificultad; }

    public Integer getCapacidadMaximaGrupo() { return capacidadMaximaGrupo; }
    public void setCapacidadMaximaGrupo(Integer capacidadMaximaGrupo) { this.capacidadMaximaGrupo = capacidadMaximaGrupo; }

    public BigDecimal getPrecioPorPersona() { return precioPorPersona; }
    public void setPrecioPorPersona(BigDecimal precioPorPersona) { this.precioPorPersona = precioPorPersona; }

    public String getUrlImagen() { return urlImagen; }
    public void setUrlImagen(String urlImagen) { this.urlImagen = urlImagen; }
}
