package com.tinambu.tours.dto.request;

import com.tinambu.tours.entity.usuario.TipoUsuario;
import jakarta.validation.constraints.*;

/**
 * DTO de request para crear/actualizar usuarios
 * Contiene validaciones y solo los campos que pueden ser modificados
 */
public class UsuarioRequest {

    @NotBlank(message = "Email es obligatorio")
    @Email(message = "Email debe tener formato válido")
    private String email;

    @NotBlank(message = "Contraseña es obligatoria")
    @Size(min = 8, message = "Contraseña debe tener al menos 8 caracteres")
    private String password;

    @NotBlank(message = "Nombre completo es obligatorio")
    @Size(min = 2, max = 100, message = "Nombre completo debe tener entre 2 y 100 caracteres")
    private String nombreCompleto;

    @NotNull(message = "Tipo de usuario es obligatorio")
    private TipoUsuario tipo;

    // Constructors
    public UsuarioRequest() {}

    public UsuarioRequest(String email, String password, String nombreCompleto, TipoUsuario tipo) {
        this.email = email;
        this.password = password;
        this.nombreCompleto = nombreCompleto;
        this.tipo = tipo;
    }

    // Getters and Setters
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getNombreCompleto() { return nombreCompleto; }
    public void setNombreCompleto(String nombreCompleto) { this.nombreCompleto = nombreCompleto; }

    public TipoUsuario getTipo() { return tipo; }
    public void setTipo(TipoUsuario tipo) { this.tipo = tipo; }

    @Override
    public String toString() {
        return "UsuarioRequest{" +
                "email='" + email + '\'' +
                ", nombreCompleto='" + nombreCompleto + '\'' +
                ", tipo=" + tipo +
                '}';
    }
}
