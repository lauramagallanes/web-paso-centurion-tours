package com.tinambu.tours.dto.response;

import com.tinambu.tours.entity.reserva.EstadoReserva;
import com.tinambu.tours.entity.reserva.TipoReserva;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO de respuesta para reservas
 * Contiene toda la información necesaria para mostrar una reserva al cliente
 */
public class ReservaResponse {
    
    private UUID id;
    private String codigoReserva;
    private TipoReserva tipoReserva;
    private String emailContacto;
    private String nombreContacto;
    private String telefonoContacto;
    private Integer numeroPersonas;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private BigDecimal precioTotal;
    private EstadoReserva estado;
    private String observaciones;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
    
    // Información específica del tipo de reserva (usando Strategy pattern)
    private String informacionAdicional;

    // Constructors
    public ReservaResponse() {}

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getCodigoReserva() { return codigoReserva; }
    public void setCodigoReserva(String codigoReserva) { this.codigoReserva = codigoReserva; }

    public TipoReserva getTipoReserva() { return tipoReserva; }
    public void setTipoReserva(TipoReserva tipoReserva) { this.tipoReserva = tipoReserva; }

    public String getEmailContacto() { return emailContacto; }
    public void setEmailContacto(String emailContacto) { this.emailContacto = emailContacto; }

    public String getNombreContacto() { return nombreContacto; }
    public void setNombreContacto(String nombreContacto) { this.nombreContacto = nombreContacto; }

    public String getTelefonoContacto() { return telefonoContacto; }
    public void setTelefonoContacto(String telefonoContacto) { this.telefonoContacto = telefonoContacto; }

    public Integer getNumeroPersonas() { return numeroPersonas; }
    public void setNumeroPersonas(Integer numeroPersonas) { this.numeroPersonas = numeroPersonas; }

    public LocalDate getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDate fechaInicio) { this.fechaInicio = fechaInicio; }

    public LocalDate getFechaFin() { return fechaFin; }
    public void setFechaFin(LocalDate fechaFin) { this.fechaFin = fechaFin; }

    public BigDecimal getPrecioTotal() { return precioTotal; }
    public void setPrecioTotal(BigDecimal precioTotal) { this.precioTotal = precioTotal; }

    public EstadoReserva getEstado() { return estado; }
    public void setEstado(EstadoReserva estado) { this.estado = estado; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) { this.fechaActualizacion = fechaActualizacion; }

    public String getInformacionAdicional() { return informacionAdicional; }
    public void setInformacionAdicional(String informacionAdicional) { this.informacionAdicional = informacionAdicional; }
}
