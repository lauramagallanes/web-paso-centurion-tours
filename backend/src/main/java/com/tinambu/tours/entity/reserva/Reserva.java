package com.tinambu.tours.entity.reserva;

import com.tinambu.tours.entity.usuario.Usuario;
import com.tinambu.tours.entity.habitacion.Habitacion;
import com.tinambu.tours.entity.sendero.Sendero;
import com.tinambu.tours.entity.guia.Guia;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "reservas", schema = "reservas")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "tipo_reserva", discriminatorType = DiscriminatorType.STRING)
public abstract class Reserva {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "codigo_reserva", unique = true, nullable = false)
    private String codigoReserva;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(name = "email_contacto", nullable = false)
    @Email(message = "Email de contacto debe ser válido")
    @NotBlank(message = "Email de contacto es obligatorio")
    private String emailContacto;

    @Column(name = "nombre_contacto", nullable = false)
    @NotBlank(message = "Nombre de contacto es obligatorio")
    private String nombreContacto;

    @Column(name = "telefono_contacto")
    private String telefonoContacto;

    @Column(name = "numero_personas", nullable = false)
    @Min(value = 1, message = "Número de personas debe ser al menos 1")
    private Integer numeroPersonas;

    @Column(name = "fecha_inicio", nullable = false)
    @NotNull(message = "Fecha de inicio es obligatoria")
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin", nullable = false)
    @NotNull(message = "Fecha de fin es obligatoria")
    private LocalDate fechaFin;

    @Column(name = "precio_total", nullable = false, precision = 12, scale = 2)
    @DecimalMin(value = "0.0", inclusive = false, message = "Precio total debe ser mayor a 0")
    private BigDecimal precioTotal;

    @Column(name = "estado", nullable = false)
    @Enumerated(EnumType.STRING)
    private EstadoReserva estado = EstadoReserva.PENDIENTE;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    // Constructors
    public Reserva() {}

    public Reserva(String emailContacto, String nombreContacto, Integer numeroPersonas, 
                   LocalDate fechaInicio, LocalDate fechaFin) {
        this.emailContacto = emailContacto;
        this.nombreContacto = nombreContacto;
        this.numeroPersonas = numeroPersonas;
        this.fechaInicio = fechaInicio;
        this.fechaFin = fechaFin;
        this.codigoReserva = generarCodigoReserva();
    }

    // Abstract methods - cada tipo de reserva implementa su lógica
    public abstract TipoReserva getTipoReserva();
    public abstract void validarReserva();
    public abstract BigDecimal calcularPrecioTotal();

    // Business Methods
    public void cambiarEstado(EstadoReserva nuevoEstado) {
        if (!estado.puedeTransicionarA(nuevoEstado)) {
            throw new IllegalStateException(
                String.format("No se puede cambiar de %s a %s", estado, nuevoEstado)
            );
        }
        this.estado = nuevoEstado;
        this.fechaActualizacion = LocalDateTime.now();
    }

    public boolean estaActiva() {
        return estado == EstadoReserva.PENDIENTE || estado == EstadoReserva.CONFIRMADA;
    }

    public int calcularNumeroDias() {
        return (int) (fechaFin.toEpochDay() - fechaInicio.toEpochDay() + 1);
    }

    private String generarCodigoReserva() {
        return "RES-" + System.currentTimeMillis() + "-" + 
               UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    @PreUpdate
    public void preUpdate() {
        this.fechaActualizacion = LocalDateTime.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getCodigoReserva() { return codigoReserva; }
    public void setCodigoReserva(String codigoReserva) { this.codigoReserva = codigoReserva; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }

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
}
