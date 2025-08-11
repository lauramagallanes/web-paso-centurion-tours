package com.tinambu.tours.dto.response;

import java.util.UUID;

/**
 * DTO de respuesta para guías
 * Expone solo la información pública sin datos sensibles como email
 */
public class GuiaResponse {
    
    private UUID id;
    private String nombre;
    private String apellido;
    private String nombreCompleto;
    private String biografia;
    private Integer anosExperiencia;
    private String especialidades;
    private String urlFoto;

    // Constructors
    public GuiaResponse() {}

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getApellido() { return apellido; }
    public void setApellido(String apellido) { this.apellido = apellido; }

    public String getNombreCompleto() { return nombreCompleto; }
    public void setNombreCompleto(String nombreCompleto) { this.nombreCompleto = nombreCompleto; }

    public String getBiografia() { return biografia; }
    public void setBiografia(String biografia) { this.biografia = biografia; }

    public Integer getAnosExperiencia() { return anosExperiencia; }
    public void setAnosExperiencia(Integer anosExperiencia) { this.anosExperiencia = anosExperiencia; }

    public String getEspecialidades() { return especialidades; }
    public void setEspecialidades(String especialidades) { this.especialidades = especialidades; }

    public String getUrlFoto() { return urlFoto; }
    public void setUrlFoto(String urlFoto) { this.urlFoto = urlFoto; }
}
