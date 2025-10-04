package com.tinambu.tours.entity.alojamiento;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "alojamientos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = false)
public class Alojamiento {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(length = 500)
    private String ubicacion;

    @Column(name = "capacidad_minima", nullable = false)
    private Integer capacidadMinima;

    @Column(name = "capacidad_maxima", nullable = false)
    private Integer capacidadMaxima;

    @Column(name = "cantidad_camas_dobles")
    @Builder.Default
    private Integer cantidadCamasDobles = 0;

    @Column(name = "cantidad_literas")
    @Builder.Default
    private Integer cantidadLiteras = 0;

    @Column(name = "hora_llegada", nullable = false)
    private LocalTime horaLlegada;

    @Column(name = "hora_salida", nullable = false)
    private LocalTime horaSalida;

    @Column(name = "precio_por_noche", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioPorNoche;

    @Column(name = "imagen_principal", length = 1000)
    private String imagenPrincipal;

    @Builder.Default
    private Boolean activo = true;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @OneToMany(mappedBy = "alojamientoId", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<AlojamientoImagen> imagenes = new ArrayList<>();

    @OneToMany(mappedBy = "alojamientoId", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<AlojamientoDisponibilidad> disponibilidades = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        fechaCreacion = LocalDateTime.now();
        fechaActualizacion = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        fechaActualizacion = LocalDateTime.now();
    }

    // Business Methods
    public BigDecimal calcularPrecioTotal(int noches, int personas) {
        if (noches <= 0 || personas <= 0) {
            throw new IllegalArgumentException("Número de noches y personas debe ser mayor a 0");
        }
        
        if (!puedeAcomodar(personas)) {
            throw new IllegalArgumentException("El alojamiento no puede acomodar " + personas + " personas");
        }
        
        return precioPorNoche.multiply(BigDecimal.valueOf(noches));
    }

    public boolean validarCapacidad(int personas) {
        return personas >= capacidadMinima && personas <= capacidadMaxima;
    }

    public boolean puedeAcomodar(int personas) {
        return validarCapacidad(personas);
    }

    public int obtenerCapacidadCamas() {
        // Cada cama doble acomoda 2 personas, cada litera acomoda 2 personas
        return (cantidadCamasDobles * 2) + (cantidadLiteras * 2);
    }

    public boolean tieneImagenes() {
        return imagenes != null && !imagenes.isEmpty();
    }

    public boolean tieneGaleria() {
        return imagenes != null && imagenes.size() > 1;
    }

    public int getTotalImagenes() {
        return imagenes != null ? imagenes.size() : 0;
    }

    // Helper method to get main image or first available
    public String getImagenPrincipalUrl() {
        if (imagenPrincipal != null && !imagenPrincipal.isEmpty()) {
            return imagenPrincipal;
        }
        
        if (imagenes != null && !imagenes.isEmpty()) {
            return imagenes.stream()
                    .filter(AlojamientoImagen::getEsPrincipal)
                    .findFirst()
                    .map(AlojamientoImagen::getUrlImagen)
                    .orElse(imagenes.get(0).getUrlImagen());
        }
        
        return null;
    }
}
