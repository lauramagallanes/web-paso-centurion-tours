package com.tinambu.tours.entity.orden;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "ordenes_compra")
public class OrdenCompra {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "codigo_orden", unique = true, nullable = false, length = 60)
    private String codigoOrden;

    @Column(name = "email_contacto", nullable = false)
    private String emailContacto;

    @Column(name = "nombre_contacto", nullable = false)
    private String nombreContacto;

    @Column(name = "telefono_contacto", length = 50)
    private String telefonoContacto;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "monto_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal montoTotal;

    @Column(name = "tipo_pago", nullable = false, length = 10)
    private String tipoPago = "TOTAL";

    @Column(name = "estado", nullable = false, length = 20)
    private String estado = "PENDIENTE";

    @Column(name = "placetopay_request_id")
    private Long placetoPayRequestId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "orden", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<OrdenCompraItem> items = new ArrayList<>();

    public OrdenCompra() {}

    public static OrdenCompra nueva(String email, String nombre, String telefono,
                                    String observaciones, BigDecimal monto, String tipoPago) {
        OrdenCompra o = new OrdenCompra();
        o.codigoOrden = "ORD-" + System.currentTimeMillis() + "-"
                + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        o.emailContacto = email;
        o.nombreContacto = nombre;
        o.telefonoContacto = telefono;
        o.observaciones = observaciones;
        o.montoTotal = monto;
        o.tipoPago = tipoPago != null ? tipoPago : "TOTAL";
        o.estado = "PENDIENTE";
        return o;
    }

    public void marcarPagada() {
        this.estado = "PAGADA";
    }

    public void marcarCancelada() {
        this.estado = "CANCELADA";
    }

    // Getters and setters
    public UUID getId() { return id; }

    public String getCodigoOrden() { return codigoOrden; }

    public String getEmailContacto() { return emailContacto; }

    public String getNombreContacto() { return nombreContacto; }

    public String getTelefonoContacto() { return telefonoContacto; }

    public String getObservaciones() { return observaciones; }

    public BigDecimal getMontoTotal() { return montoTotal; }
    public void setMontoTotal(BigDecimal montoTotal) { this.montoTotal = montoTotal; }

    public String getTipoPago() { return tipoPago; }
    public void setTipoPago(String tipoPago) { this.tipoPago = tipoPago; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public Long getPlacetoPayRequestId() { return placetoPayRequestId; }
    public void setPlacetoPayRequestId(Long placetoPayRequestId) { this.placetoPayRequestId = placetoPayRequestId; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public List<OrdenCompraItem> getItems() { return items; }
    public void setItems(List<OrdenCompraItem> items) { this.items = items; }

    public void addItem(OrdenCompraItem item) {
        item.setOrden(this);
        this.items.add(item);
    }
}
