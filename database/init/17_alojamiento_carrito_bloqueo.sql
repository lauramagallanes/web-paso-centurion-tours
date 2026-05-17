-- Carrito: bloqueos temporales por usuario (máx. 2 h) sobre fechas de alojamiento.
-- Manual: reserva_id IS NULL y carrito_usuario_id IS NULL.
-- Carrito: reserva_id IS NULL y carrito_usuario_id IS NOT NULL y carrito_expira_en > now().

ALTER TABLE alojamiento_reserva_bloqueos
    ADD COLUMN IF NOT EXISTS carrito_usuario_id UUID NULL;

ALTER TABLE alojamiento_reserva_bloqueos
    ADD COLUMN IF NOT EXISTS carrito_expira_en TIMESTAMP NULL;

-- Permite bloqueos manuales y de carrito sin reserva asociada
ALTER TABLE alojamiento_reserva_bloqueos
    ALTER COLUMN reserva_id DROP NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_alojamiento_bloqueo_carrito_usuario'
    ) THEN
        ALTER TABLE alojamiento_reserva_bloqueos
            ADD CONSTRAINT fk_alojamiento_bloqueo_carrito_usuario
            FOREIGN KEY (carrito_usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_alojamiento_bloqueos_carrito_expira
    ON alojamiento_reserva_bloqueos (carrito_usuario_id, carrito_expira_en)
    WHERE activo = true AND carrito_usuario_id IS NOT NULL;

COMMIT;
