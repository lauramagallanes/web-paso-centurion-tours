package com.tinambu.tours.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/**
 * Availability status for a sendero on a specific date + shift.
 * Never exposes guide names — only internal availability data.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DisponibilidadSenderoResponse {

    private boolean disponible;
    private int cuposTotal;
    private int cuposOcupados;
    private int cuposRestantes;
    private boolean hayGuiaDisponible;
    private String senderoNombre;
    private String mensajeUsuario;

    /** Senderos the user can book instead, when this one is unavailable. */
    private List<AlternativaSendero> alternativas;

    public DisponibilidadSenderoResponse() {}

    public static class AlternativaSendero {
        private String id;
        private String nombre;

        public AlternativaSendero() {}
        public AlternativaSendero(String id, String nombre) {
            this.id = id;
            this.nombre = nombre;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getNombre() { return nombre; }
        public void setNombre(String nombre) { this.nombre = nombre; }
    }

    // ── Getters & Setters ────────────────────────────────────────────────────

    public boolean isDisponible() { return disponible; }
    public void setDisponible(boolean disponible) { this.disponible = disponible; }

    public int getCuposTotal() { return cuposTotal; }
    public void setCuposTotal(int cuposTotal) { this.cuposTotal = cuposTotal; }

    public int getCuposOcupados() { return cuposOcupados; }
    public void setCuposOcupados(int cuposOcupados) { this.cuposOcupados = cuposOcupados; }

    public int getCuposRestantes() { return cuposRestantes; }
    public void setCuposRestantes(int cuposRestantes) { this.cuposRestantes = cuposRestantes; }

    public boolean isHayGuiaDisponible() { return hayGuiaDisponible; }
    public void setHayGuiaDisponible(boolean hayGuiaDisponible) { this.hayGuiaDisponible = hayGuiaDisponible; }

    public String getSenderoNombre() { return senderoNombre; }
    public void setSenderoNombre(String senderoNombre) { this.senderoNombre = senderoNombre; }

    public String getMensajeUsuario() { return mensajeUsuario; }
    public void setMensajeUsuario(String mensajeUsuario) { this.mensajeUsuario = mensajeUsuario; }

    public List<AlternativaSendero> getAlternativas() { return alternativas; }
    public void setAlternativas(List<AlternativaSendero> alternativas) { this.alternativas = alternativas; }
}
