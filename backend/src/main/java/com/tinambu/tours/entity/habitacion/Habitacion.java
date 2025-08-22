package com.tinambu.tours.entity.habitacion;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "habitaciones")
public class Habitacion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    @NotBlank(message = "Número de habitación es obligatorio")
    private String numero;

    @Column(nullable = false)
    @NotBlank(message = "Nombre de habitación es obligatorio")
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "capacidad_minima", nullable = false)
    @Min(value = 1, message = "Capacidad mínima debe ser al menos 1")
    private Integer capacidadMinima = 2;

    @Column(name = "capacidad_maxima", nullable = false)
    @Min(value = 1, message = "Capacidad máxima debe ser al menos 1")
    private Integer capacidadMaxima = 4;

    @Column(name = "precio_por_persona_noche", nullable = false, precision = 10, scale = 2)
    @DecimalMin(value = "0.0", inclusive = false, message = "Precio debe ser mayor a 0")
    private BigDecimal precioPorPersonaNoche = new BigDecimal("1500.00");

    @Column(name = "url_imagen")
    private String urlImagen;

    @Column(name = "activa", nullable = false)
    private Boolean activa = true;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    // Constructors
    public Habitacion() {}

    public Habitacion(String numero, String nombre, String descripcion) {
        this.numero = numero;
        this.nombre = nombre;
        this.descripcion = descripcion;
    }

    // Business Methods
    public boolean puedeAcomodar(int numeroPersonas) {
        return numeroPersonas >= capacidadMinima && numeroPersonas <= capacidadMaxima;
    }

    public BigDecimal calcularPrecioTotal(int numeroPersonas, int numeroNoches) {
        if (!puedeAcomodar(numeroPersonas)) {
            throw new IllegalArgumentException(
                String.format("Habitación %s no puede acomodar %d personas (min: %d, max: %d)", 
                    numero, numeroPersonas, capacidadMinima, capacidadMaxima)
            );
        }
        return precioPorPersonaNoche
            .multiply(BigDecimal.valueOf(numeroPersonas))
            .multiply(BigDecimal.valueOf(numeroNoches));
    }

    @PreUpdate
    public void preUpdate() {
        this.fechaActualizacion = LocalDateTime.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public Integer getCapacidadMinima() { return capacidadMinima; }
    public void setCapacidadMinima(Integer capacidadMinima) { this.capacidadMinima = capacidadMinima; }

    public Integer getCapacidadMaxima() { return capacidadMaxima; }
    public void setCapacidadMaxima(Integer capacidadMaxima) { this.capacidadMaxima = capacidadMaxima; }

    public BigDecimal getPrecioPorPersonaNoche() { return precioPorPersonaNoche; }
    public void setPrecioPorPersonaNoche(BigDecimal precioPorPersonaNoche) { this.precioPorPersonaNoche = precioPorPersonaNoche; }

    public String getUrlImagen() { return urlImagen; }
    public void setUrlImagen(String urlImagen) { this.urlImagen = urlImagen; }

    public Boolean getActiva() { return activa; }
    public void setActiva(Boolean activa) { this.activa = activa; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) { this.fechaActualizacion = fechaActualizacion; }
}
