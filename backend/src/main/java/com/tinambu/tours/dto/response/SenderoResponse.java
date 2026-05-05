package com.tinambu.tours.dto.response;

import com.tinambu.tours.entity.sendero.NivelDificultad;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * DTO de respuesta para senderos
 * Expone solo la información pública necesaria para el frontend
 * Updated for multiple image support based on senderos-implementation-plan.md
 */
public class SenderoResponse {
    
    private UUID id;
    private String nombre;
    private String descripcion;
    private BigDecimal duracionHoras;
    private NivelDificultad nivelDificultad;
    private Integer capacidadMaximaGrupo;
    private BigDecimal precioPorPersona;
    private String urlImagen; // Legacy field for backward compatibility
    private Boolean activo = true;
    
    // New fields for multiple image support
    private String imagenPrincipal; // Main image URL
    private Boolean tieneGaleria = false; // Has gallery (multiple images)
    private Integer totalImagenes = 0; // Total number of images
    private List<SenderoImagenResponse> imagenes; // All images (optional, for detailed view)

    // Constructors
    public SenderoResponse() {}

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

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

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }

    // New getters and setters for image support
    public String getImagenPrincipal() { return imagenPrincipal; }
    public void setImagenPrincipal(String imagenPrincipal) { this.imagenPrincipal = imagenPrincipal; }

    public Boolean getTieneGaleria() { return tieneGaleria; }
    public void setTieneGaleria(Boolean tieneGaleria) { this.tieneGaleria = tieneGaleria; }

    public Integer getTotalImagenes() { return totalImagenes; }
    public void setTotalImagenes(Integer totalImagenes) { this.totalImagenes = totalImagenes; }

    public List<SenderoImagenResponse> getImagenes() { return imagenes; }
    public void setImagenes(List<SenderoImagenResponse> imagenes) { this.imagenes = imagenes; }
}
