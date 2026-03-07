package com.tinambu.tours.entity.orden;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "orden_compra_items")
public class OrdenCompraItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "orden_id", nullable = false)
    private OrdenCompra orden;

    @Column(name = "reserva_id", nullable = false)
    private UUID reservaId;

    @Column(name = "tipo_reserva", nullable = false, length = 20)
    private String tipoReserva;

    @Column(name = "subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "descripcion", length = 500)
    private String descripcion;

    public OrdenCompraItem() {}

    public OrdenCompraItem(OrdenCompra orden, UUID reservaId, String tipoReserva,
                           BigDecimal subtotal, String descripcion) {
        this.orden = orden;
        this.reservaId = reservaId;
        this.tipoReserva = tipoReserva;
        this.subtotal = subtotal;
        this.descripcion = descripcion;
    }

    // Getters and setters
    public UUID getId() { return id; }

    public OrdenCompra getOrden() { return orden; }
    public void setOrden(OrdenCompra orden) { this.orden = orden; }

    public UUID getReservaId() { return reservaId; }
    public void setReservaId(UUID reservaId) { this.reservaId = reservaId; }

    public String getTipoReserva() { return tipoReserva; }
    public void setTipoReserva(String tipoReserva) { this.tipoReserva = tipoReserva; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
}
