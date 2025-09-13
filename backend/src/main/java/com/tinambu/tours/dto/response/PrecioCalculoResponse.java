package com.tinambu.tours.dto.response;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class PrecioCalculoResponse {
    private UUID senderoId;
    private String senderoNombre;
    private Integer adultos;
    private Integer ninos;
    private Integer totalPersonas;
    
    // Price breakdown
    private BigDecimal precioBase;
    private BigDecimal precioAdultos;
    private BigDecimal precioNinos;
    private BigDecimal descuentoGrupo;
    private BigDecimal descuentoNinos;
    private BigDecimal precioTotal;
    
    // Deposit and payment info
    private BigDecimal montoSeña;
    private BigDecimal saldoRestante;
    private BigDecimal porcentajeSeña;
    
    // Discount details
    private List<String> detalleDescuentos;
    
    // Additional info
    private boolean aplicaDescuentoGrupo;
    private boolean aplicaDescuentoNinos;
    private String moneda;

    // Constructors
    public PrecioCalculoResponse() {
        this.moneda = "USD";
        this.porcentajeSeña = BigDecimal.valueOf(30.00);
    }

    public PrecioCalculoResponse(UUID senderoId, String senderoNombre, Integer adultos, Integer ninos) {
        this();
        this.senderoId = senderoId;
        this.senderoNombre = senderoNombre;
        this.adultos = adultos;
        this.ninos = ninos;
        this.totalPersonas = adultos + ninos;
    }

    // Business methods
    public void calcularMontoSeña() {
        if (precioTotal != null && porcentajeSeña != null) {
            this.montoSeña = precioTotal.multiply(porcentajeSeña)
                                      .divide(BigDecimal.valueOf(100));
            this.saldoRestante = precioTotal.subtract(montoSeña);
        }
    }

    public boolean requiereSeña() {
        return montoSeña != null && montoSeña.compareTo(BigDecimal.ZERO) > 0;
    }

    public String getResumenPrecio() {
        return String.format("Total: %s %s (Seña: %s %s, Saldo: %s %s)", 
                           moneda, precioTotal,
                           moneda, montoSeña,
                           moneda, saldoRestante);
    }

    // Getters and Setters
    public UUID getSenderoId() {
        return senderoId;
    }

    public void setSenderoId(UUID senderoId) {
        this.senderoId = senderoId;
    }

    public String getSenderoNombre() {
        return senderoNombre;
    }

    public void setSenderoNombre(String senderoNombre) {
        this.senderoNombre = senderoNombre;
    }

    public Integer getAdultos() {
        return adultos;
    }

    public void setAdultos(Integer adultos) {
        this.adultos = adultos;
    }

    public Integer getNinos() {
        return ninos;
    }

    public void setNinos(Integer ninos) {
        this.ninos = ninos;
    }

    public Integer getTotalPersonas() {
        return totalPersonas;
    }

    public void setTotalPersonas(Integer totalPersonas) {
        this.totalPersonas = totalPersonas;
    }

    public BigDecimal getPrecioBase() {
        return precioBase;
    }

    public void setPrecioBase(BigDecimal precioBase) {
        this.precioBase = precioBase;
    }

    public BigDecimal getPrecioAdultos() {
        return precioAdultos;
    }

    public void setPrecioAdultos(BigDecimal precioAdultos) {
        this.precioAdultos = precioAdultos;
    }

    public BigDecimal getPrecioNinos() {
        return precioNinos;
    }

    public void setPrecioNinos(BigDecimal precioNinos) {
        this.precioNinos = precioNinos;
    }

    public BigDecimal getDescuentoGrupo() {
        return descuentoGrupo;
    }

    public void setDescuentoGrupo(BigDecimal descuentoGrupo) {
        this.descuentoGrupo = descuentoGrupo;
    }

    public BigDecimal getDescuentoNinos() {
        return descuentoNinos;
    }

    public void setDescuentoNinos(BigDecimal descuentoNinos) {
        this.descuentoNinos = descuentoNinos;
    }

    public BigDecimal getPrecioTotal() {
        return precioTotal;
    }

    public void setPrecioTotal(BigDecimal precioTotal) {
        this.precioTotal = precioTotal;
        calcularMontoSeña(); // Recalculate when total changes
    }

    public BigDecimal getMontoSeña() {
        return montoSeña;
    }

    public void setMontoSeña(BigDecimal montoSeña) {
        this.montoSeña = montoSeña;
    }

    public BigDecimal getSaldoRestante() {
        return saldoRestante;
    }

    public void setSaldoRestante(BigDecimal saldoRestante) {
        this.saldoRestante = saldoRestante;
    }

    public BigDecimal getPorcentajeSeña() {
        return porcentajeSeña;
    }

    public void setPorcentajeSeña(BigDecimal porcentajeSeña) {
        this.porcentajeSeña = porcentajeSeña;
        calcularMontoSeña(); // Recalculate when percentage changes
    }

    public List<String> getDetalleDescuentos() {
        return detalleDescuentos;
    }

    public void setDetalleDescuentos(List<String> detalleDescuentos) {
        this.detalleDescuentos = detalleDescuentos;
    }

    public boolean isAplicaDescuentoGrupo() {
        return aplicaDescuentoGrupo;
    }

    public void setAplicaDescuentoGrupo(boolean aplicaDescuentoGrupo) {
        this.aplicaDescuentoGrupo = aplicaDescuentoGrupo;
    }

    public boolean isAplicaDescuentoNinos() {
        return aplicaDescuentoNinos;
    }

    public void setAplicaDescuentoNinos(boolean aplicaDescuentoNinos) {
        this.aplicaDescuentoNinos = aplicaDescuentoNinos;
    }

    public String getMoneda() {
        return moneda;
    }

    public void setMoneda(String moneda) {
        this.moneda = moneda;
    }

    @Override
    public String toString() {
        return "PrecioCalculoResponse{" +
                "senderoId=" + senderoId +
                ", senderoNombre='" + senderoNombre + '\'' +
                ", adultos=" + adultos +
                ", ninos=" + ninos +
                ", totalPersonas=" + totalPersonas +
                ", precioTotal=" + precioTotal +
                ", montoSeña=" + montoSeña +
                ", saldoRestante=" + saldoRestante +
                ", aplicaDescuentoGrupo=" + aplicaDescuentoGrupo +
                ", aplicaDescuentoNinos=" + aplicaDescuentoNinos +
                '}';
    }
}
