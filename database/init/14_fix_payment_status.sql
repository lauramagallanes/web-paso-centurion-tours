-- Migration 14: Fix payment status for existing reservations
-- 
-- Rules applied:
-- 1. Update check constraints to include NO_CORRESPONDE
-- 2. Cancelled reservations → estado_pago = 'NO_CORRESPONDE'
-- 3. Confirmed reservations with pending payment → revert to PENDIENTE
--    (payment must be registered before confirming under new business rules)

-- ============================================================
-- Update check constraints to allow NO_CORRESPONDE
-- ============================================================

ALTER TABLE reservas DROP CONSTRAINT IF EXISTS reservas_estado_pago_check;
ALTER TABLE reservas ADD CONSTRAINT reservas_estado_pago_check
  CHECK (estado_pago IN ('PENDIENTE', 'PARCIAL', 'COMPLETO', 'NO_CORRESPONDE'));

-- ============================================================
-- Fix SENDERO reservations (reservas table)
-- ============================================================

-- Cancelled sendero reservations: set NO_CORRESPONDE
UPDATE reservas
SET estado_pago = 'NO_CORRESPONDE',
    fecha_actualizacion = NOW()
WHERE estado = 'CANCELADA'
  AND (estado_pago != 'NO_CORRESPONDE' OR estado_pago IS NULL);

-- Confirmed sendero reservations with no payment: revert to PENDIENTE
UPDATE reservas
SET estado = 'PENDIENTE',
    fecha_actualizacion = NOW()
WHERE estado = 'CONFIRMADA'
  AND (estado_pago = 'PENDIENTE' OR estado_pago IS NULL);

-- ============================================================
-- Fix ALOJAMIENTO reservations (alojamiento_reservas table)
-- ============================================================

-- Cancelled alojamiento reservations: set NO_CORRESPONDE
UPDATE alojamiento_reservas
SET estado_pago = 'NO_CORRESPONDE',
    fecha_actualizacion = NOW()
WHERE estado = 'CANCELADA'
  AND (estado_pago != 'NO_CORRESPONDE' OR estado_pago IS NULL);

-- Confirmed alojamiento reservations with no payment: revert to PENDIENTE
UPDATE alojamiento_reservas
SET estado = 'PENDIENTE',
    fecha_actualizacion = NOW()
WHERE estado = 'CONFIRMADA'
  AND (estado_pago = 'PENDIENTE' OR estado_pago IS NULL);
