package com.tinambu.tours.entity.sendero;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "senderos", schema = "contenido")
public class Sendero {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    @NotBlank(message = "Nombre del sendero es obligatorio")
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "duracion_horas", nullable = false)
    @DecimalMin(value = "0.5", message = "Duración debe ser al menos 0.5 horas")
    private BigDecimal duracionHoras;

    @Column(name = "nivel_dificultad", nullable = false)
    @Enumerated(EnumType.STRING)
    private NivelDificultad nivelDificultad;

    @Column(name = "capacidad_maxima_grupo", nullable = false)
    @Min(value = 1, message = "Capacidad máxima debe ser al menos 1")
    private Integer capacidadMaximaGrupo = 8;

    @Column(name = "precio_por_persona", nullable = false, precision = 10, scale = 2)
    @DecimalMin(value = "0.0", inclusive = false, message = "Precio debe ser mayor a 0")
    private BigDecimal precioPorPersona;

    @Column(name = "url_imagen")
    private String urlImagen;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    // Constructors
    public Sendero() {}

    public Sendero(String nombre, String descripcion, BigDecimal duracionHoras, 
                   NivelDificultad nivelDificultad, BigDecimal precioPorPersona) {
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.duracionHoras = duracionHoras;
        this.nivelDificultad = nivelDificultad;
        this.precioPorPersona = precioPorPersona;
    }

    // Business Methods
    public boolean puedeAcomodarGrupo(int numeroPersonas) {
        return numeroPersonas > 0 && numeroPersonas <= capacidadMaximaGrupo;
    }

    public BigDecimal calcularPrecioTotal(int numeroPersonas) {
        if (!puedeAcomodarGrupo(numeroPersonas)) {
            throw new IllegalArgumentException(
                String.format("Sendero %s no puede acomodar %d personas (máximo: %d)", 
                    nombre, numeroPersonas, capacidadMaximaGrupo)
            );
        }
        return precioPorPersona.multiply(BigDecimal.valueOf(numeroPersonas));
    }

    @PreUpdate
    public void preUpdate() {
        this.fechaActualizacion = LocalDateTime.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public BigDecimal getDuracionHoras() { return duracionHoras; }
    public void setDuracionHoras(BigDecimal duracionHoras) { this.duracionHoras = duracionHoras; }

    public NivelDificultad getNivelDificultad() { return nivelDificultad; }
    public void setNivelDificultad(NivelDificultad nivelDificultad) { this.nivelDificultad = nivelDificultad; }

    public Integer getCapacidadMaximaGrupo() { return capacidadMaximaGrupo; }
    public void setCapacidadMaximaGrupo(Integer capacidadMaximaGrupo) { this.capacidadMaximaGrupo = capacidadMaximaGrupo; }

    public BigDecimal getPrecioPorPersona() { return precioPorPersona; }
    public void setPrecioPorPersona(BigDecimal precioPorPersona) { this.precioPorPersona = precioPorPersona; }

    public String getUrlImagen() { return urlImagen; }
    public void setUrlImagen(String urlImagen) { this.urlImagen = urlImagen; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) { this.fechaActualizacion = fechaActualizacion; }
}
