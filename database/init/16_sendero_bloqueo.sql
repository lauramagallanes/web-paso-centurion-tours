-- 16_sendero_bloqueo.sql
-- Tabla de bloqueos puntuales para senderos.
-- Una fila representa un período (puede ser un solo día) en el cual el sendero
-- NO está disponible, opcionalmente acotado a un turno (NULL = ambos turnos).
-- La regla de disponibilidad final es:
--   disponible(fecha, turno) = existe ventana en sendero_disponibilidad que aplique
--                              Y no existe fila en sendero_bloqueo que la cubra

CREATE TABLE IF NOT EXISTS sendero_bloqueo (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sendero_id          UUID NOT NULL REFERENCES senderos(id) ON DELETE CASCADE,
    fecha_inicio        DATE NOT NULL,
    fecha_fin           DATE NOT NULL,
    turno               VARCHAR(10),                -- 'MANANA' | 'TARDE' | NULL (ambos)
    motivo              VARCHAR(255),
    fecha_creacion      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_sendero_bloqueo_rango_valido
        CHECK (fecha_fin >= fecha_inicio),
    CONSTRAINT chk_sendero_bloqueo_turno_valido
        CHECK (turno IS NULL OR turno IN ('MANANA', 'TARDE'))
);

CREATE INDEX IF NOT EXISTS idx_sendero_bloqueo_sendero_id
    ON sendero_bloqueo(sendero_id);

CREATE INDEX IF NOT EXISTS idx_sendero_bloqueo_rango
    ON sendero_bloqueo(sendero_id, fecha_inicio, fecha_fin);
