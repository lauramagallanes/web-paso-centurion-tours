package com.tinambu.tours.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlojamientoPrecioCalculoResponse {

    private BigDecimal precioBasePorNoche;
    private Integer numeroNoches;
    private BigDecimal precioTotal;
    private LocalDate fechaCheckIn;
    private LocalDate fechaCheckOut;
    private Integer numeroHuespedes;
    private Integer capacidadMaxima;
    private UUID alojamientoId;
    private String alojamientoNombre;

    // Campos adicionales para desglose de precio
    private BigDecimal subtotal;
    private BigDecimal descuentos;
    private BigDecimal impuestos;
    private String moneda;

    // Business methods
    public BigDecimal getPrecioPorPersona() {
        if (numeroHuespedes == null || numeroHuespedes == 0) return BigDecimal.ZERO;
        return precioTotal.divide(BigDecimal.valueOf(numeroHuespedes), 2, BigDecimal.ROUND_HALF_UP);
    }

    public BigDecimal getPrecioPorNoche() {
        if (numeroNoches == null || numeroNoches == 0) return BigDecimal.ZERO;
        return precioTotal.divide(BigDecimal.valueOf(numeroNoches), 2, BigDecimal.ROUND_HALF_UP);
    }

    public String getResumenEstancia() {
        return numeroNoches + " noche" + (numeroNoches > 1 ? "s" : "") + 
               " para " + numeroHuespedes + " huésped" + (numeroHuespedes > 1 ? "es" : "");
    }

    public String getResumenFechas() {
        return fechaCheckIn + " al " + fechaCheckOut;
    }

    public boolean tieneDescuentos() {
        return descuentos != null && descuentos.compareTo(BigDecimal.ZERO) > 0;
    }

    public boolean tieneImpuestos() {
        return impuestos != null && impuestos.compareTo(BigDecimal.ZERO) > 0;
    }

    public BigDecimal getPorcentajeOcupacion() {
        if (capacidadMaxima == null || capacidadMaxima == 0) return BigDecimal.ZERO;
        return BigDecimal.valueOf(numeroHuespedes)
                .divide(BigDecimal.valueOf(capacidadMaxima), 2, BigDecimal.ROUND_HALF_UP)
                .multiply(BigDecimal.valueOf(100));
    }

    public long getDiasHastaCheckIn() {
        return ChronoUnit.DAYS.between(LocalDate.now(), fechaCheckIn);
    }

    public String getMonedaFormateada() {
        return moneda != null ? moneda : "UYU";
    }

    public String getPrecioFormateado() {
        return String.format("%.2f %s", precioTotal, getMonedaFormateada());
    }
}
