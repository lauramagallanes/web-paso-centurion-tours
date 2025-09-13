package com.tinambu.tours.entity.reserva;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

public enum EstadoPago {
    PENDIENTE("Pendiente", "Sin pagos registrados"),
    PARCIAL("Parcial", "Pago parcial recibido (seña)"),
    COMPLETO("Completo", "Pago total recibido");

    private final String nombre;
    private final String descripcion;

    EstadoPago(String nombre, String descripcion) {
        this.nombre = nombre;
        this.descripcion = descripcion;
    }

    public String getNombre() {
        return nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    // Business logic methods
    public boolean puedeTransicionarA(EstadoPago nuevoEstado) {
        return switch (this) {
            case PENDIENTE -> nuevoEstado == PARCIAL || nuevoEstado == COMPLETO;
            case PARCIAL -> nuevoEstado == COMPLETO || nuevoEstado == PENDIENTE;
            case COMPLETO -> nuevoEstado == PARCIAL; // Solo si hay devolución
        };
    }

    public static EstadoPago calcularEstadoPorMonto(BigDecimal montoPagado, BigDecimal montoTotal) {
        if (montoPagado == null || montoPagado.compareTo(BigDecimal.ZERO) == 0) {
            return PENDIENTE;
        }
        
        if (montoPagado.compareTo(montoTotal) >= 0) {
            return COMPLETO;
        }
        
        return PARCIAL;
    }

    public boolean esPendiente() {
        return this == PENDIENTE;
    }

    public boolean esParcial() {
        return this == PARCIAL;
    }

    public boolean esCompleto() {
        return this == COMPLETO;
    }

    public boolean requiereAccion() {
        return this == PENDIENTE || this == PARCIAL;
    }

    public static List<EstadoPago> getEstadosActivos() {
        return Arrays.asList(PENDIENTE, PARCIAL, COMPLETO);
    }

    public static EstadoPago fromString(String value) {
        if (value == null) return PENDIENTE;
        
        return switch (value.toUpperCase()) {
            case "PENDIENTE", "PENDING" -> PENDIENTE;
            case "PARCIAL", "PARTIAL" -> PARCIAL;
            case "COMPLETO", "COMPLETE", "PAID" -> COMPLETO;
            default -> throw new IllegalArgumentException("Estado de pago no válido: " + value);
        };
    }

    public String getCssClass() {
        return switch (this) {
            case PENDIENTE -> "badge-warning";
            case PARCIAL -> "badge-info";
            case COMPLETO -> "badge-success";
        };
    }

    public String getIcono() {
        return switch (this) {
            case PENDIENTE -> "clock";
            case PARCIAL -> "info";
            case COMPLETO -> "check-circle";
        };
    }

    @Override
    public String toString() {
        return nombre;
    }
}
