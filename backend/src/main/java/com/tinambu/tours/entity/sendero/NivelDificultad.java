package com.tinambu.tours.entity.sendero;

public enum NivelDificultad {
    FACIL("Fácil - Apto para todas las edades y condiciones físicas"),
    MODERADO("Moderado - Requiere condición física básica"),
    DIFICIL("Difícil - Requiere buena condición física y experiencia"),
    EXPERTO("Experto - Solo para personas con excelente condición física");

    private final String descripcion;

    NivelDificultad(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDescripcion() {
        return descripcion;
    }
}
