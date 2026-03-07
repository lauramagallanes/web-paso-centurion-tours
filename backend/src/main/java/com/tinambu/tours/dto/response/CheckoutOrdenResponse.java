package com.tinambu.tours.dto.response;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class CheckoutOrdenResponse {

    private UUID ordenId;
    private String codigoOrden;
    private BigDecimal montoTotal;
    private String tipoPago;
    private String processUrl;
    private String status;
    private String message;
    private List<ReservaCreada> reservas;

    // Builder-style factory
    public static CheckoutOrdenResponse of(UUID ordenId, String codigoOrden,
                                            BigDecimal montoTotal, String tipoPago,
                                            String processUrl, String status, String message,
                                            List<ReservaCreada> reservas) {
        CheckoutOrdenResponse r = new CheckoutOrdenResponse();
        r.ordenId = ordenId;
        r.codigoOrden = codigoOrden;
        r.montoTotal = montoTotal;
        r.tipoPago = tipoPago;
        r.processUrl = processUrl;
        r.status = status;
        r.message = message;
        r.reservas = reservas;
        return r;
    }

    // Getters
    public UUID getOrdenId() { return ordenId; }
    public String getCodigoOrden() { return codigoOrden; }
    public BigDecimal getMontoTotal() { return montoTotal; }
    public String getTipoPago() { return tipoPago; }
    public String getProcessUrl() { return processUrl; }
    public String getStatus() { return status; }
    public String getMessage() { return message; }
    public List<ReservaCreada> getReservas() { return reservas; }

    public static class ReservaCreada {
        private UUID reservaId;
        private String tipoReserva;
        private String codigoReserva;
        private BigDecimal subtotal;
        private String descripcion;

        public static ReservaCreada of(UUID reservaId, String tipoReserva,
                                       String codigoReserva, BigDecimal subtotal, String descripcion) {
            ReservaCreada rc = new ReservaCreada();
            rc.reservaId = reservaId;
            rc.tipoReserva = tipoReserva;
            rc.codigoReserva = codigoReserva;
            rc.subtotal = subtotal;
            rc.descripcion = descripcion;
            return rc;
        }

        public UUID getReservaId() { return reservaId; }
        public String getTipoReserva() { return tipoReserva; }
        public String getCodigoReserva() { return codigoReserva; }
        public BigDecimal getSubtotal() { return subtotal; }
        public String getDescripcion() { return descripcion; }
    }
}
