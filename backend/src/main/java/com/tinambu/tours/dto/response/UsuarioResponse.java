package com.tinambu.tours.dto.response;

import com.tinambu.tours.entity.usuario.TipoUsuario;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO de respuesta para información de usuario
 * No incluye información sensible como contraseñas
 */
public class UsuarioResponse {

    private UUID id;
    private String email;
    private String nombreCompleto;
    private TipoUsuario tipo;
    private Boolean activo;
    private LocalDateTime fechaCreacion;

    // Constructors
    public UsuarioResponse() {}

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getNombreCompleto() { return nombreCompleto; }
    public void setNombreCompleto(String nombreCompleto) { this.nombreCompleto = nombreCompleto; }

    public TipoUsuario getTipo() { return tipo; }
    public void setTipo(TipoUsuario tipo) { this.tipo = tipo; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }
}
