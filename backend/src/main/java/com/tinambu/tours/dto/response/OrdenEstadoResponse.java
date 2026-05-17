package com.tinambu.tours.dto.response;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class OrdenEstadoResponse {

    private UUID ordenId;
    private String codigoOrden;
    private String estadoOrden;
    private BigDecimal montoTotal;
    private String tipoPago;
    private String placetoPayStatus;
    private String placetoPayMessage;
    private List<ItemEstado> items;
    private String nombreContacto;

    public static OrdenEstadoResponse of(UUID ordenId, String codigoOrden, String estadoOrden,
                                          BigDecimal montoTotal, String tipoPago,
                                          String p2pStatus, String p2pMessage,
                                          List<ItemEstado> items, String nombreContacto) {
        OrdenEstadoResponse r = new OrdenEstadoResponse();
        r.ordenId = ordenId;
        r.codigoOrden = codigoOrden;
        r.estadoOrden = estadoOrden;
        r.montoTotal = montoTotal;
        r.tipoPago = tipoPago;
        r.placetoPayStatus = p2pStatus;
        r.placetoPayMessage = p2pMessage;
        r.items = items;
        r.nombreContacto = nombreContacto;
        return r;
    }

    // Getters
    public UUID getOrdenId() { return ordenId; }
    public String getCodigoOrden() { return codigoOrden; }
    public String getEstadoOrden() { return estadoOrden; }
    public BigDecimal getMontoTotal() { return montoTotal; }
    public String getTipoPago() { return tipoPago; }
    public String getPlacetoPayStatus() { return placetoPayStatus; }
    public String getPlacetoPayMessage() { return placetoPayMessage; }
    public List<ItemEstado> getItems() { return items; }

    public String getNombreContacto() { return nombreContacto; }

    public static class ItemEstado {
        private UUID reservaId;
        private String tipoReserva;
        private String estadoReserva;
        private BigDecimal subtotal;
        private String descripcion;

        public static ItemEstado of(UUID reservaId, String tipoReserva, String estadoReserva,
                                    BigDecimal subtotal, String descripcion) {
            ItemEstado i = new ItemEstado();
            i.reservaId = reservaId;
            i.tipoReserva = tipoReserva;
            i.estadoReserva = estadoReserva;
            i.subtotal = subtotal;
            i.descripcion = descripcion;
            return i;
        }

        public UUID getReservaId() { return reservaId; }
        public String getTipoReserva() { return tipoReserva; }
        public String getEstadoReserva() { return estadoReserva; }
        public BigDecimal getSubtotal() { return subtotal; }
        public String getDescripcion() { return descripcion; }
    }
}
