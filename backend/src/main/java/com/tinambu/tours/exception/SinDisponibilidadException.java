package com.tinambu.tours.exception;

import java.util.List;

/**
 * Thrown when a sendero has no availability for the requested date/shift.
 * Carries a list of alternative senderos that DO have availability,
 * so the controller can include them in the response for the user.
 */
public class SinDisponibilidadException extends RuntimeException {

    private final List<AlternativaSendero> alternativas;

    public SinDisponibilidadException(String message, List<AlternativaSendero> alternativas) {
        super(message);
        this.alternativas = alternativas != null ? alternativas : List.of();
    }

    public List<AlternativaSendero> getAlternativas() {
        return alternativas;
    }

    public static class AlternativaSendero {
        private final String id;
        private final String nombre;

        public AlternativaSendero(String id, String nombre) {
            this.id = id;
            this.nombre = nombre;
        }

        public String getId() { return id; }
        public String getNombre() { return nombre; }
    }
}
