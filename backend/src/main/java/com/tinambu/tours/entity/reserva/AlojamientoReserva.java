package com.tinambu.tours.entity.reserva;

import com.tinambu.tours.entity.alojamiento.Alojamiento;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Entity
@Table(name = "alojamiento_reservas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlojamientoReserva {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "codigo_reserva", unique = true, nullable = false)
    private String codigoReserva;

    @Column(name = "email_contacto", nullable = false)
    private String emailContacto;

    @Column(name = "nombre_contacto", nullable = false)
    private String nombreContacto;

    @Column(name = "telefono_contacto")
    private String telefonoContacto;

    @Column(name = "estado", nullable = false)
    @Enumerated(EnumType.STRING)
    private EstadoReserva estado = EstadoReserva.PENDIENTE;

    @Column(name = "precio_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioTotal;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @Column(name = "alojamiento_id", nullable = false)
    private UUID alojamientoId;

    @Column(name = "fecha_check_in", nullable = false)
    private LocalDate fechaCheckIn;

    @Column(name = "fecha_check_out", nullable = false)
    private LocalDate fechaCheckOut;

    @Column(name = "numero_noches")
    private Integer numeroNoches;

    @Column(name = "numero_huespedes", nullable = false)
    private Integer numeroHuespedes;

    @Column(name = "observaciones_especiales", columnDefinition = "TEXT")
    private String observacionesEspeciales;

    @Column(name = "placetopay_request_id")
    private Long placetoPayRequestId;

    // Payment tracking fields
    @Column(name = "monto_pagado", precision = 12, scale = 2)
    private BigDecimal montoPagado = BigDecimal.ZERO;

    @Column(name = "saldo_pendiente", precision = 12, scale = 2)
    private BigDecimal saldoPendiente;

    @Column(name = "estado_pago", length = 20)
    @Enumerated(EnumType.STRING)
    private EstadoPago estadoPago = EstadoPago.PENDIENTE;

    @Column(name = "metodo_pago", length = 50)
    private String metodoPago;

    @Column(name = "tipo_pago", length = 20)
    private String tipoPago; // TOTAL or SENA

    @Column(name = "porcentaje_sena", precision = 5, scale = 2)
    private BigDecimal porcentajeSena = BigDecimal.valueOf(30.00);

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alojamiento_id", insertable = false, updatable = false)
    private Alojamiento alojamiento;

    @PrePersist
    @PreUpdate
    protected void calcularNoches() {
        if (fechaCheckIn != null && fechaCheckOut != null) {
            this.numeroNoches = (int) ChronoUnit.DAYS.between(fechaCheckIn, fechaCheckOut);
        }
    }

    // Business Methods
    public int calcularNumeroNoches() {
        if (fechaCheckIn == null || fechaCheckOut == null) {
            return 0;
        }
        return (int) ChronoUnit.DAYS.between(fechaCheckIn, fechaCheckOut);
    }

    public boolean validarFechas() {
        if (fechaCheckIn == null || fechaCheckOut == null) {
            return false;
        }
        return fechaCheckIn.isBefore(fechaCheckOut);
    }

    public BigDecimal calcularPrecioTotal() {
        if (alojamiento == null) {
            return this.precioTotal != null ? this.precioTotal : BigDecimal.ZERO;
        }
        
        int noches = calcularNumeroNoches();
        if (noches <= 0) {
            return BigDecimal.ZERO;
        }
        
        // Simple calculation: price per night * nights * guests
        BigDecimal precioPorNoche = alojamiento.getPrecioPorNoche();
        return precioPorNoche.multiply(BigDecimal.valueOf(noches))
                            .multiply(BigDecimal.valueOf(numeroHuespedes));
    }

    public boolean estaEnRango(LocalDate fecha) {
        return !fecha.isBefore(fechaCheckIn) && fecha.isBefore(fechaCheckOut);
    }

    public boolean seSolapaCon(LocalDate checkIn, LocalDate checkOut) {
        return !(fechaCheckOut.isBefore(checkIn) || fechaCheckIn.isAfter(checkOut));
    }

    public boolean esValidaParaAlojamiento(Alojamiento alojamiento) {
        return validarFechas() && 
               alojamiento.puedeAcomodar(numeroHuespedes) &&
               numeroNoches > 0;
    }

    public long getDiasHastaCheckIn() {
        return ChronoUnit.DAYS.between(LocalDate.now(), fechaCheckIn);
    }

    public long getDiasDesdeCheckOut() {
        return ChronoUnit.DAYS.between(fechaCheckOut, LocalDate.now());
    }

    public boolean estaActiva() {
        LocalDate hoy = LocalDate.now();
        return !hoy.isBefore(fechaCheckIn) && hoy.isBefore(fechaCheckOut);
    }

    // Payment methods
    public void registrarPago(BigDecimal monto, String metodo) {
        if (monto == null || monto.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Monto del pago debe ser mayor a cero");
        }
        this.montoPagado = (this.montoPagado == null) ? monto : this.montoPagado.add(monto);
        this.metodoPago = metodo;
        actualizarEstadoPago();
    }

    public void actualizarEstadoPago() {
        if (montoPagado == null || precioTotal == null) {
            this.estadoPago = EstadoPago.PENDIENTE;
            return;
        }
        if (montoPagado.compareTo(BigDecimal.ZERO) == 0) {
            this.estadoPago = EstadoPago.PENDIENTE;
        } else if (montoPagado.compareTo(precioTotal) >= 0) {
            this.estadoPago = EstadoPago.COMPLETO;
        } else {
            this.estadoPago = EstadoPago.PARCIAL;
        }
        this.saldoPendiente = precioTotal.subtract(montoPagado);
    }

    public BigDecimal calcularMontoSena() {
        if (porcentajeSena == null || precioTotal == null) {
            return BigDecimal.ZERO;
        }
        return precioTotal.multiply(porcentajeSena).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
    }

    public boolean estaPagadaCompletamente() {
        return estadoPago == EstadoPago.COMPLETO;
    }

    public boolean tienePagosPendientes() {
        return estadoPago == EstadoPago.PENDIENTE || estadoPago == EstadoPago.PARCIAL;
    }
}