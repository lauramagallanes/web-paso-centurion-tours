package com.tinambu.tours.dto.request;

import com.tinambu.tours.entity.usuario.TipoUsuario;
import jakarta.validation.constraints.*;

/**
 * DTO de request para actualizar usuarios existentes
 * No incluye contraseña (se maneja por separado por seguridad)
 */
public class UsuarioUpdateRequest {

    @NotBlank(message = "Email es obligatorio")
    @Email(message = "Email debe tener formato válido")
    private String email;

    @NotBlank(message = "Nombre completo es obligatorio")
    @Size(min = 2, max = 100, message = "Nombre completo debe tener entre 2 y 100 caracteres")
    private String nombreCompleto;

    @NotNull(message = "Tipo de usuario es obligatorio")
    private TipoUsuario tipo;

    // Constructors
    public UsuarioUpdateRequest() {}

    public UsuarioUpdateRequest(String email, String nombreCompleto, TipoUsuario tipo) {
        this.email = email;
        this.nombreCompleto = nombreCompleto;
        this.tipo = tipo;
    }

    // Getters and Setters
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getNombreCompleto() { return nombreCompleto; }
    public void setNombreCompleto(String nombreCompleto) { this.nombreCompleto = nombreCompleto; }

    public TipoUsuario getTipo() { return tipo; }
    public void setTipo(TipoUsuario tipo) { this.tipo = tipo; }

    @Override
    public String toString() {
        return "UsuarioUpdateRequest{" +
                "email='" + email + '\'' +
                ", nombreCompleto='" + nombreCompleto + '\'' +
                ", tipo=" + tipo +
                '}';
    }
}
