package com.tinambu.tours.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EstadoPagoResponse {

    private UUID reservaId;
    private String codigoReserva;
    private String tipoReserva;
    private String estadoPago;          // PENDIENTE, PARCIAL, COMPLETO
    private String estadoReserva;       // PENDIENTE, CONFIRMADA, CANCELADA, COMPLETADA
    private BigDecimal precioTotal;
    private BigDecimal montoPagado;
    private BigDecimal saldoPendiente;
    private String placetoPayStatus;    // APPROVED, REJECTED, PENDING, etc.
    private String placetoPayMessage;
    private Long placetoPayRequestId;
}
