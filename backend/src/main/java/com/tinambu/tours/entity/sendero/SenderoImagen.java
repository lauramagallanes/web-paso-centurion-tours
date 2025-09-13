package com.tinambu.tours.entity.sendero;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "sendero_imagenes")
public class SenderoImagen {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(
        name = "UUID",
        strategy = "org.hibernate.id.UUIDGenerator"
    )
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "sendero_id", nullable = false)
    private UUID senderoId;

    @Column(name = "url_imagen", nullable = false, length = 512)
    private String urlImagen;

    @Column(name = "descripcion", length = 255)
    private String descripcion;

    @Column(name = "orden", nullable = false)
    private Integer orden;

    @Column(name = "es_principal", nullable = false)
    private Boolean esPrincipal = false;

    @CreationTimestamp
    @Column(name = "fecha_subida", nullable = false)
    private LocalDateTime fechaSubida;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sendero_id", insertable = false, updatable = false)
    private Sendero sendero;

    // Constructors
    public SenderoImagen() {}

    public SenderoImagen(UUID senderoId, String urlImagen, String descripcion, Integer orden) {
        this.senderoId = senderoId;
        this.urlImagen = urlImagen;
        this.descripcion = descripcion;
        this.orden = orden;
        this.esPrincipal = false;
    }

    // Business methods
    public void marcarComoPrincipal() {
        this.esPrincipal = true;
    }

    public void desmarcarComoPrincipal() {
        this.esPrincipal = false;
    }

    public boolean esPrimera() {
        return this.orden != null && this.orden == 1;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getSenderoId() {
        return senderoId;
    }

    public void setSenderoId(UUID senderoId) {
        this.senderoId = senderoId;
    }

    public String getUrlImagen() {
        return urlImagen;
    }

    public void setUrlImagen(String urlImagen) {
        this.urlImagen = urlImagen;
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

    public Sendero getSendero() {
        return sendero;
    }

    public void setSendero(Sendero sendero) {
        this.sendero = sendero;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof SenderoImagen)) return false;
        SenderoImagen that = (SenderoImagen) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "SenderoImagen{" +
                "id=" + id +
                ", senderoId=" + senderoId +
                ", urlImagen='" + urlImagen + '\'' +
                ", orden=" + orden +
                ", esPrincipal=" + esPrincipal +
                '}';
    }
}
