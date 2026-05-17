package com.tinambu.tours.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

/**
 * Agrupa reservas existentes con saldo pendiente en una sola orden de pago (tarjeta o Prex).
 */
public class CheckoutPagarPendientesRequest {

    @NotBlank(message = "El email de contacto es obligatorio")
    private String emailContacto;

    @NotBlank(message = "El nombre de contacto es obligatorio")
    private String nombreContacto;

    private String telefonoContacto;
    private String observaciones;

    /** "CARD" o "PREX" (mismo criterio que {@link CheckoutOrdenRequest}). */
    private String metodoPago = "CARD";

    @NotEmpty(message = "Debe incluir al menos una reserva")
    @Valid
    private List<ItemPendiente> items;

    public static class ItemPendiente {
        @NotBlank(message = "El tipo de reserva es obligatorio")
        private String tipo;

        @NotNull(message = "El id de reserva es obligatorio")
        private UUID reservaId;

        public String getTipo() {
            return tipo;
        }

        public void setTipo(String tipo) {
            this.tipo = tipo;
        }

        public UUID getReservaId() {
            return reservaId;
        }

        public void setReservaId(UUID reservaId) {
            this.reservaId = reservaId;
        }
    }

    public String getEmailContacto() {
        return emailContacto;
    }

    public void setEmailContacto(String emailContacto) {
        this.emailContacto = emailContacto;
    }

    public String getNombreContacto() {
        return nombreContacto;
    }

    public void setNombreContacto(String nombreContacto) {
        this.nombreContacto = nombreContacto;
    }

    public String getTelefonoContacto() {
        return telefonoContacto;
    }

    public void setTelefonoContacto(String telefonoContacto) {
        this.telefonoContacto = telefonoContacto;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public String getMetodoPago() {
        return metodoPago;
    }

    public void setMetodoPago(String metodoPago) {
        this.metodoPago = metodoPago;
    }

    public List<ItemPendiente> getItems() {
        return items;
    }

    public void setItems(List<ItemPendiente> items) {
        this.items = items;
    }
}
