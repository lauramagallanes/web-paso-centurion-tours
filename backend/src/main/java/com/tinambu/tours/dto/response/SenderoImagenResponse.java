package com.tinambu.tours.dto.response;

import com.tinambu.tours.entity.sendero.SenderoImagen;

import java.time.LocalDateTime;
import java.util.UUID;

public class SenderoImagenResponse {
    private UUID id;
    private String url;
    private String descripcion;
    private Integer orden;
    private Boolean esPrincipal;
    private LocalDateTime fechaSubida;

    // Constructors
    public SenderoImagenResponse() {}

    public SenderoImagenResponse(SenderoImagen imagen) {
        this.id = imagen.getId();
        this.url = imagen.getUrlImagen();
        this.descripcion = imagen.getDescripcion();
        this.orden = imagen.getOrden();
        this.esPrincipal = imagen.getEsPrincipal();
        this.fechaSubida = imagen.getFechaSubida();
    }

    public SenderoImagenResponse(UUID id, String url, String descripcion, 
                               Integer orden, Boolean esPrincipal, LocalDateTime fechaSubida) {
        this.id = id;
        this.url = url;
        this.descripcion = descripcion;
        this.orden = orden;
        this.esPrincipal = esPrincipal;
        this.fechaSubida = fechaSubida;
    }

    // Static factory method
    public static SenderoImagenResponse from(SenderoImagen imagen) {
        return new SenderoImagenResponse(imagen);
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Integer getOrden() {
        return orden;
    }

    public void setOrden(Integer orden) {
        this.orden = orden;
    }

    public Boolean getEsPrincipal() {
        return esPrincipal;
    }

    public void setEsPrincipal(Boolean esPrincipal) {
        this.esPrincipal = esPrincipal;
    }

    public LocalDateTime getFechaSubida() {
        return fechaSubida;
    }

    public void setFechaSubida(LocalDateTime fechaSubida) {
        this.fechaSubida = fechaSubida;
    }

    @Override
    public String toString() {
        return "SenderoImagenResponse{" +
                "id=" + id +
                ", url='" + url + '\'' +
                ", descripcion='" + descripcion + '\'' +
                ", orden=" + orden +
                ", esPrincipal=" + esPrincipal +
                ", fechaSubida=" + fechaSubida +
                '}';
    }
}
