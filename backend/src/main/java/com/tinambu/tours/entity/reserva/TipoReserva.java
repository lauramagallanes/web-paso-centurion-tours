package com.tinambu.tours.entity.reserva;

public enum TipoReserva {
    ALOJAMIENTO("Reserva de habitación - por persona por noche"),
    SENDERO("Reserva de sendero - por persona por día");

    private final String descripcion;

    TipoReserva(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDescripcion() {
        return descripcion;
    }
}
