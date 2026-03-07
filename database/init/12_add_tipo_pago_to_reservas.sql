-- 12_add_tipo_pago_to_reservas.sql
-- Agrega tipo_pago a la tabla reservas para que SenderoReserva pueda registrar
-- si el usuario eligió pago total o seña (30%), igual que AlojamientoReserva.

ALTER TABLE reservas
    ADD COLUMN IF NOT EXISTS tipo_pago VARCHAR(10)
        CHECK (tipo_pago IN ('TOTAL', 'SENA', 'SALDO'));
