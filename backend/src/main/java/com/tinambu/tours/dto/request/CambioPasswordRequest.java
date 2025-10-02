package com.tinambu.tours.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO de request para cambio de contraseña
 */
public class CambioPasswordRequest {

    @NotBlank(message = "Nueva contraseña es obligatoria")
    @Size(min = 8, message = "Contraseña debe tener al menos 8 caracteres")
    private String nuevaPassword;

    @NotBlank(message = "Confirmación de contraseña es obligatoria")
    private String confirmacionPassword;

    // Constructors
    public CambioPasswordRequest() {}

    public CambioPasswordRequest(String nuevaPassword, String confirmacionPassword) {
        this.nuevaPassword = nuevaPassword;
        this.confirmacionPassword = confirmacionPassword;
    }

    // Custom validation method
    public boolean passwordsMatch() {
        return nuevaPassword != null && nuevaPassword.equals(confirmacionPassword);
    }

    // Getters and Setters
    public String getNuevaPassword() { return nuevaPassword; }
    public void setNuevaPassword(String nuevaPassword) { this.nuevaPassword = nuevaPassword; }

    public String getConfirmacionPassword() { return confirmacionPassword; }
    public void setConfirmacionPassword(String confirmacionPassword) { this.confirmacionPassword = confirmacionPassword; }
}
