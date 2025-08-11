package com.tinambu.tours.dto.request;

import jakarta.validation.constraints.*;

/**
 * DTO de request para crear/actualizar guías
 * Contiene validaciones y solo los campos que pueden ser modificados por el usuario
 */
public class GuiaRequest {

    @NotBlank(message = "Nombre del guía es obligatorio")
    private String nombre;

    @NotBlank(message = "Apellido del guía es obligatorio")
    private String apellido;

    @Email(message = "Email debe tener formato válido")
    private String email;

    private String biografia;

    @Min(value = 0, message = "Años de experiencia debe ser 0 o mayor")
    private Integer anosExperiencia;

    private String especialidades; // e.g., "Aves, Mamíferos, Botánica"

    private String urlFoto;

    // Constructors
    public GuiaRequest() {}

    // Getters and Setters
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getApellido() { return apellido; }
    public void setApellido(String apellido) { this.apellido = apellido; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getBiografia() { return biografia; }
    public void setBiografia(String biografia) { this.biografia = biografia; }

    public Integer getAnosExperiencia() { return anosExperiencia; }
    public void setAnosExperiencia(Integer anosExperiencia) { this.anosExperiencia = anosExperiencia; }

    public String getEspecialidades() { return especialidades; }
    public void setEspecialidades(String especialidades) { this.especialidades = especialidades; }

    public String getUrlFoto() { return urlFoto; }
    public void setUrlFoto(String urlFoto) { this.urlFoto = urlFoto; }
}
