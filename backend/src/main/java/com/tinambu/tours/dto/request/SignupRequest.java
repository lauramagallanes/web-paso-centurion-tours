package com.tinambu.tours.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO para request de registro de usuario
 */
public class SignupRequest {

    @NotBlank(message = "Email es obligatorio")
    @Email(message = "Email debe tener formato válido")
    private String email;

    @NotBlank(message = "Contraseña es obligatoria")
    @Size(min = 8, message = "Contraseña debe tener al menos 8 caracteres")
    private String password;

    @NotBlank(message = "Nombre completo es obligatorio")
    @Size(min = 2, max = 100, message = "Nombre completo debe tener entre 2 y 100 caracteres")
    private String nombreCompleto;

    // Constructors
    public SignupRequest() {}

    public SignupRequest(String email, String password, String nombreCompleto) {
        this.email = email;
        this.password = password;
        this.nombreCompleto = nombreCompleto;
    }

    // Getters and Setters
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getNombreCompleto() { return nombreCompleto; }
    public void setNombreCompleto(String nombreCompleto) { this.nombreCompleto = nombreCompleto; }
}
