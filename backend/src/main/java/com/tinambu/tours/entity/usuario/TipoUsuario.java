package com.tinambu.tours.entity.usuario;

public enum TipoUsuario {
    VISITANTE("Visitante - puede hacer reservas"),
    ADMIN("Administrador - acceso completo al panel de administración");

    private final String descripcion;

    TipoUsuario(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDescripcion() {
        return descripcion;
    }
}
