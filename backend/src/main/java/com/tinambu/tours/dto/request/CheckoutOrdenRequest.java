package com.tinambu.tours.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class CheckoutOrdenRequest {

    @NotBlank(message = "Email de contacto es obligatorio")
    @Email(message = "Email debe tener formato válido")
    private String emailContacto;

    @NotBlank(message = "Nombre de contacto es obligatorio")
    private String nombreContacto;

    private String telefonoContacto;

    private String observaciones;

    private String tipoPago = "TOTAL";

    /** "CARD" (PlacetoPay/Getnet) o "PREX" (transferencia). Default: CARD. */
    private String metodoPago = "CARD";

    /** ISO 3166-1 alpha-2 del país del comprador (UY, AR, CL, PE…). Opcional. */
    private String paisComprador;

    @NotEmpty(message = "El carrito debe tener al menos un ítem")
    @Valid
    private List<ItemOrdenRequest> items;

    // Getters and setters
    public String getEmailContacto() { return emailContacto; }
    public void setEmailContacto(String emailContacto) { this.emailContacto = emailContacto; }

    public String getNombreContacto() { return nombreContacto; }
    public void setNombreContacto(String nombreContacto) { this.nombreContacto = nombreContacto; }

    public String getTelefonoContacto() { return telefonoContacto; }
    public void setTelefonoContacto(String telefonoContacto) { this.telefonoContacto = telefonoContacto; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public String getTipoPago() { return tipoPago; }
    public void setTipoPago(String tipoPago) { this.tipoPago = tipoPago; }

    public String getMetodoPago() { return metodoPago; }
    public void setMetodoPago(String metodoPago) { this.metodoPago = metodoPago; }

    public String getPaisComprador() { return paisComprador; }
    public void setPaisComprador(String paisComprador) { this.paisComprador = paisComprador; }

    public List<ItemOrdenRequest> getItems() { return items; }
    public void setItems(List<ItemOrdenRequest> items) { this.items = items; }

    public static class ItemOrdenRequest {

        private String tipo; // SENDERO or ALOJAMIENTO

        private String productoId;

        // Sendero specific
        private String fechaInicio;
        private String fechaFin;
        private String turno;
        private Integer numeroPersonas;

        // Alojamiento specific
        private String fechaCheckIn;
        private String fechaCheckOut;
        private Integer numeroHuespedes;

        // Getters and setters
        public String getTipo() { return tipo; }
        public void setTipo(String tipo) { this.tipo = tipo; }

        public String getProductoId() { return productoId; }
        public void setProductoId(String productoId) { this.productoId = productoId; }

        public String getFechaInicio() { return fechaInicio; }
        public void setFechaInicio(String fechaInicio) { this.fechaInicio = fechaInicio; }

        public String getFechaFin() { return fechaFin; }
        public void setFechaFin(String fechaFin) { this.fechaFin = fechaFin; }

        public String getTurno() { return turno; }
        public void setTurno(String turno) { this.turno = turno; }

        public Integer getNumeroPersonas() { return numeroPersonas; }
        public void setNumeroPersonas(Integer numeroPersonas) { this.numeroPersonas = numeroPersonas; }

        public String getFechaCheckIn() { return fechaCheckIn; }
        public void setFechaCheckIn(String fechaCheckIn) { this.fechaCheckIn = fechaCheckIn; }

        public String getFechaCheckOut() { return fechaCheckOut; }
        public void setFechaCheckOut(String fechaCheckOut) { this.fechaCheckOut = fechaCheckOut; }

        public Integer getNumeroHuespedes() { return numeroHuespedes; }
        public void setNumeroHuespedes(Integer numeroHuespedes) { this.numeroHuespedes = numeroHuespedes; }
    }
}
