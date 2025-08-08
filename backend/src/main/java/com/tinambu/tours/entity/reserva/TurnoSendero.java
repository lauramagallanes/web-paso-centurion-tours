package com.tinambu.tours.entity.reserva;

public enum TurnoSendero {
    MANANA("Mañana (8:00 - 12:00)"),
    TARDE("Tarde (14:00 - 18:00)");

    private final String descripcion;

    TurnoSendero(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDescripcion() {
        return descripcion;
    }
}
