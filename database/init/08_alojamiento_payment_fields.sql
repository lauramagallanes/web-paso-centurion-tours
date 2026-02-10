-- Migration: Add payment tracking fields to alojamiento_reservas
-- These fields mirror the payment fields in the reservas table (sendero)
-- to support seña (30%) and full payment tracking for accommodations.

ALTER TABLE alojamiento_reservas ADD COLUMN IF NOT EXISTS monto_pagado DECIMAL(12,2) DEFAULT 0;
ALTER TABLE alojamiento_reservas ADD COLUMN IF NOT EXISTS saldo_pendiente DECIMAL(12,2);
ALTER TABLE alojamiento_reservas ADD COLUMN IF NOT EXISTS estado_pago VARCHAR(20) DEFAULT 'PENDIENTE';
ALTER TABLE alojamiento_reservas ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(50);
ALTER TABLE alojamiento_reservas ADD COLUMN IF NOT EXISTS tipo_pago VARCHAR(20);
ALTER TABLE alojamiento_reservas ADD COLUMN IF NOT EXISTS porcentaje_sena DECIMAL(5,2) DEFAULT 30.00;

-- Index for payment status queries
CREATE INDEX IF NOT EXISTS idx_alojamiento_reservas_estado_pago ON alojamiento_reservas(estado_pago);
