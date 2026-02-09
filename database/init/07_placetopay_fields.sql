-- ================================================================
-- Migration 07: Add PlacetoPay integration fields
-- ================================================================

-- Add placetopay_request_id to reservas table (SenderoReserva uses inheritance)
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS placetopay_request_id BIGINT;

-- Add placetopay_request_id to alojamiento_reservas table (separate entity)
ALTER TABLE alojamiento_reservas ADD COLUMN IF NOT EXISTS placetopay_request_id BIGINT;

-- Add index for quick lookups by PlacetoPay request ID
CREATE INDEX IF NOT EXISTS idx_reservas_placetopay_request_id 
    ON reservas(placetopay_request_id) WHERE placetopay_request_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_alojamiento_reservas_placetopay_request_id 
    ON alojamiento_reservas(placetopay_request_id) WHERE placetopay_request_id IS NOT NULL;
