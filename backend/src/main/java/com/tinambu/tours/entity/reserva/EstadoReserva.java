package com.tinambu.tours.entity.reserva;

public enum EstadoReserva {
    PENDIENTE("Pendiente de confirmación"),
    CONFIRMADA("Confirmada por administrador"),
    CANCELADA("Cancelada"),
    COMPLETADA("Completada");

    private final String descripcion;

    EstadoReserva(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public boolean puedeTransicionarA(EstadoReserva nuevoEstado) {
        return switch (this) {
            case PENDIENTE -> nuevoEstado == CONFIRMADA || nuevoEstado == CANCELADA;
            case CONFIRMADA -> nuevoEstado == COMPLETADA || nuevoEstado == CANCELADA;
            case CANCELADA, COMPLETADA -> false; // Estados finales
        };
    }
}
