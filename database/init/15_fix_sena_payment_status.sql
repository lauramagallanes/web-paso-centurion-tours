-- Fix reservations that were incorrectly marked as COMPLETO when only the seña (30%) was paid.
-- These are reservations where:
--   - estado_pago = 'COMPLETO'
--   - monto_pagado < precio_total (meaning the full amount was NOT actually paid)
--   - They belong to an OrdenCompra with tipo_pago = 'SENA'

-- Fix alojamiento reservations
UPDATE reservas r
SET
    estado_pago    = 'PARCIAL',
    saldo_pendiente = precio_total - monto_pagado
WHERE
    dtype            = 'AlojamientoReserva'
    AND estado_pago  = 'COMPLETO'
    AND monto_pagado IS NOT NULL
    AND precio_total IS NOT NULL
    AND monto_pagado < precio_total;

-- Fix sendero reservations
UPDATE reservas r
SET
    estado_pago     = 'PARCIAL',
    saldo_pendiente = precio_total - monto_pagado
WHERE
    dtype            = 'SenderoReserva'
    AND estado_pago  = 'COMPLETO'
    AND monto_pagado IS NOT NULL
    AND precio_total IS NOT NULL
    AND monto_pagado < precio_total;
