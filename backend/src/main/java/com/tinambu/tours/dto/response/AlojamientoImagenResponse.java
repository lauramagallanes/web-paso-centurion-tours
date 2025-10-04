package com.tinambu.tours.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlojamientoImagenResponse {

    private UUID id;
    private String url;
    private String descripcion;
    private Integer orden;
    private Boolean esPrincipal;
    private LocalDateTime fechaSubida;
    private UUID alojamientoId;

    // Business methods
    public String getTipoImagen() {
        return esPrincipal ? "Principal" : "Galería";
    }

    public boolean esImagenValida() {
        return url != null && !url.trim().isEmpty();
    }

    public String getDescripcionCorta() {
        if (descripcion == null || descripcion.isEmpty()) {
            return "Imagen " + (orden + 1);
        }
        return descripcion.length() > 50 ? 
               descripcion.substring(0, 47) + "..." : 
               descripcion;
    }

    public String getFormatoFecha() {
        if (fechaSubida == null) return "";
        return fechaSubida.toString();
    }
}
