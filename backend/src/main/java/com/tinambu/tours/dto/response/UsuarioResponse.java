package com.tinambu.tours.dto.response;

import com.tinambu.tours.entity.usuario.TipoUsuario;
import com.tinambu.tours.entity.usuario.Usuario;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO de response para usuarios
 * NO incluye información sensible como contraseñas
 */
public class UsuarioResponse {

    private UUID id;
    private String email;
    private String nombreCompleto;
    private TipoUsuario tipo;
    private Boolean activo;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;

    // Constructors
    public UsuarioResponse() {}

    /**
     * Constructor que convierte una entidad Usuario a UsuarioResponse
     */
    public UsuarioResponse(Usuario usuario) {
        this.id = usuario.getId();
        this.email = usuario.getEmail();
        this.nombreCompleto = usuario.getNombreCompleto();
        this.tipo = usuario.getTipo();
        this.activo = usuario.getActivo();
        this.fechaCreacion = usuario.getFechaCreacion();
        // Usuario no tiene fechaActualizacion, se puede agregar null o quitar el campo
        this.fechaActualizacion = null;
    }

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

    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) { this.fechaActualizacion = fechaActualizacion; }

    @Override
    public String toString() {
        return "UsuarioResponse{" +
                "id=" + id +
                ", email='" + email + '\'' +
                ", nombreCompleto='" + nombreCompleto + '\'' +
                ", tipo=" + tipo +
                ", activo=" + activo +
                ", fechaCreacion=" + fechaCreacion +
                '}';
    }
}
