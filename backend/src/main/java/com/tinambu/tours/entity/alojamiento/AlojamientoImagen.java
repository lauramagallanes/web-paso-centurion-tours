package com.tinambu.tours.entity.alojamiento;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "alojamiento_imagenes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = false)
public class AlojamientoImagen {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "alojamiento_id", nullable = false)
    private UUID alojamientoId;

    @Column(name = "url_imagen", nullable = false, length = 1000)
    private String urlImagen;

    @Column(length = 500)
    private String descripcion;

    @Column(nullable = false)
    @Builder.Default
    private Integer orden = 0;

    @Column(name = "es_principal")
    @Builder.Default
    private Boolean esPrincipal = false;

    @Column(name = "fecha_subida")
    private LocalDateTime fechaSubida;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alojamiento_id", insertable = false, updatable = false)
    private Alojamiento alojamiento;

    @PrePersist
    protected void onCreate() {
        fechaSubida = LocalDateTime.now();
    }

    // Business Methods
    public void marcarComoPrincipal() {
        this.esPrincipal = true;
    }

    public void desmarcarComoPrincipal() {
        this.esPrincipal = false;
    }

    public boolean esImagenValida() {
        return urlImagen != null && !urlImagen.trim().isEmpty();
    }
}
