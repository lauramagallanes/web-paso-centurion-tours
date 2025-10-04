package com.tinambu.tours.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlojamientoResponse {

    private UUID id;
    private String nombre;
    private String descripcion;
    private String ubicacion;
    private Integer capacidadMinima;
    private Integer capacidadMaxima;
    private Integer cantidadCamasDobles;
    private Integer cantidadLiteras;
    private LocalTime horaLlegada;
    private LocalTime horaSalida;
    private BigDecimal precioPorNoche;
    private String imagenPrincipal;
    private Boolean activo;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;

    @Builder.Default
    private List<AlojamientoImagenResponse> imagenes = new ArrayList<>();
    
    private Integer totalImagenes;
    private Boolean tieneGaleria;

    // Business methods
    public String getCapacidadFormateada() {
        if (capacidadMinima.equals(capacidadMaxima)) {
            return capacidadMinima + " persona" + (capacidadMinima > 1 ? "s" : "");
        }
        return capacidadMinima + "-" + capacidadMaxima + " personas";
    }

    public String getConfiguracionCamasFormateada() {
        StringBuilder config = new StringBuilder();
        
        if (cantidadCamasDobles > 0) {
            config.append(cantidadCamasDobles)
                  .append(" cama")
                  .append(cantidadCamasDobles > 1 ? "s" : "")
                  .append(" doble")
                  .append(cantidadCamasDobles > 1 ? "s" : "");
        }
        
        if (cantidadLiteras > 0) {
            if (config.length() > 0) config.append(", ");
            config.append(cantidadLiteras)
                  .append(" litera")
                  .append(cantidadLiteras > 1 ? "s" : "");
        }
        
        return config.toString();
    }

    public String getHorariosFormateados() {
        return "Check-in: " + horaLlegada + " - Check-out: " + horaSalida;
    }

    public BigDecimal getPrecioFormateado() {
        return precioPorNoche;
    }

    public String getImagenPrincipalUrl() {
        if (imagenPrincipal != null && !imagenPrincipal.isEmpty()) {
            return imagenPrincipal;
        }
        
        if (imagenes != null && !imagenes.isEmpty()) {
            return imagenes.stream()
                    .filter(AlojamientoImagenResponse::getEsPrincipal)
                    .findFirst()
                    .map(AlojamientoImagenResponse::getUrl)
                    .orElse(imagenes.get(0).getUrl());
        }
        
        return null;
    }

    public Boolean getTieneGaleria() {
        return imagenes != null && imagenes.size() > 1;
    }

    public Integer getTotalImagenes() {
        return imagenes != null ? imagenes.size() : 0;
    }

    public int getCapacidadCamas() {
        return (cantidadCamasDobles * 2) + (cantidadLiteras * 2);
    }

    public boolean puedeAcomodar(int personas) {
        return personas >= capacidadMinima && personas <= capacidadMaxima;
    }
}
