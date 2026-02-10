package com.tinambu.tours.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlojamientoReservaResponse {

    private UUID id;
    private String codigoReserva;
    private String emailContacto;
    private String nombreContacto;
    private String telefonoContacto;
    private String estado;
    private BigDecimal precioTotal;
    private String observaciones;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;

    private UUID alojamientoId;
    private String alojamientoNombre;
    private LocalDate fechaCheckIn;
    private LocalDate fechaCheckOut;
    private Integer numeroNoches;
    private Integer numeroHuespedes;
    private String observacionesEspeciales;
    
    // Payment tracking
    private Long placetoPayRequestId;
    private BigDecimal montoPagado;
    private BigDecimal saldoPendiente;
    private String estadoPago;
    private String metodoPago;
    private String tipoPago;
    private BigDecimal porcentajeSena;
    
    // Campos adicionales para gestión
    private String ubicacionAlojamiento;
    private BigDecimal precioPorNoche;
    private String configuracionCamas;
    private String horariosCheckInOut;

    // Business methods
    public int calcularNumeroNoches() {
        if (fechaCheckIn == null || fechaCheckOut == null) return 0;
        return (int) ChronoUnit.DAYS.between(fechaCheckIn, fechaCheckOut);
    }

    public String getResumenEstancia() {
        return numeroNoches + " noche" + (numeroNoches > 1 ? "s" : "") + 
               " para " + numeroHuespedes + " huésped" + (numeroHuespedes > 1 ? "es" : "");
    }

    public String getResumenFechas() {
        return fechaCheckIn + " al " + fechaCheckOut;
    }

    public boolean estaActiva() {
        LocalDate hoy = LocalDate.now();
        return !hoy.isBefore(fechaCheckIn) && hoy.isBefore(fechaCheckOut);
    }

    public boolean esFutura() {
        return fechaCheckIn.isAfter(LocalDate.now());
    }

    public boolean esPasada() {
        return fechaCheckOut.isBefore(LocalDate.now());
    }

    public long getDiasHastaCheckIn() {
        return ChronoUnit.DAYS.between(LocalDate.now(), fechaCheckIn);
    }

    public long getDiasDesdeCheckOut() {
        return ChronoUnit.DAYS.between(fechaCheckOut, LocalDate.now());
    }

    public String getEstadoEstancia() {
        LocalDate hoy = LocalDate.now();
        if (hoy.isBefore(fechaCheckIn)) {
            return "Próxima (" + getDiasHastaCheckIn() + " días)";
        } else if (hoy.isBefore(fechaCheckOut)) {
            return "En curso";
        } else {
            return "Finalizada";
        }
    }

    public BigDecimal getPrecioPorPersona() {
        if (numeroHuespedes == null || numeroHuespedes == 0) return BigDecimal.ZERO;
        return getPrecioTotal().divide(BigDecimal.valueOf(numeroHuespedes), 2, BigDecimal.ROUND_HALF_UP);
    }

    public boolean requiereCheckIn() {
        return fechaCheckIn.equals(LocalDate.now()) && 
               "CONFIRMADA".equals(estado);
    }

    public boolean requiereCheckOut() {
        return fechaCheckOut.equals(LocalDate.now()) && 
               "CONFIRMADA".equals(estado);
    }
}
