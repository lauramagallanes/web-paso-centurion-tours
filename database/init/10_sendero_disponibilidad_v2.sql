-- 10_sendero_disponibilidad_v2.sql
-- Adds turno, dias_semana, cupos_total to sendero_disponibilidad
-- and migrates existing rows to the one-row-per-turno model.

-- ── 1. New columns ────────────────────────────────────────────────────────────
ALTER TABLE sendero_disponibilidad
    ADD COLUMN IF NOT EXISTS turno       VARCHAR(10),
    ADD COLUMN IF NOT EXISTS dias_semana VARCHAR(150),   -- 'LUNES,MARTES,...' or NULL = all days
    ADD COLUMN IF NOT EXISTS cupos_total INTEGER NOT NULL DEFAULT 8;

-- ── 2. Drop old check constraint that requires at least one turno boolean ─────
ALTER TABLE sendero_disponibilidad
    DROP CONSTRAINT IF EXISTS chk_at_least_one_turn;

-- ── 3. Migrate existing rows ──────────────────────────────────────────────────

-- Rows where only MANANA was true
UPDATE sendero_disponibilidad
SET turno = 'MANANA'
WHERE turno_manana = true AND turno_tarde = false AND turno IS NULL;

-- Rows where only TARDE was true
UPDATE sendero_disponibilidad
SET turno = 'TARDE'
WHERE turno_manana = false AND turno_tarde = true AND turno IS NULL;

-- Rows where both were true: set to MANANA, create a companion TARDE row
DO $$
DECLARE
    row_rec        RECORD;
    new_disp_id    UUID;
BEGIN
    FOR row_rec IN
        SELECT *
        FROM sendero_disponibilidad
        WHERE turno_manana = true AND turno_tarde = true AND turno IS NULL
    LOOP
        -- Keep existing row as MANANA
        UPDATE sendero_disponibilidad
        SET turno = 'MANANA'
        WHERE id = row_rec.id;

        -- Create companion TARDE row
        INSERT INTO sendero_disponibilidad (
            id, sendero_id, fecha_inicio, fecha_fin,
            turno_manana, turno_tarde,
            activo, cupos_total,
            fecha_creacion, turno
        ) VALUES (
            gen_random_uuid(),
            row_rec.sendero_id,
            row_rec.fecha_inicio,
            row_rec.fecha_fin,
            false, true,
            row_rec.activo,
            row_rec.cupos_total,
            CURRENT_TIMESTAMP,
            'TARDE'
        )
        RETURNING id INTO new_disp_id;

        -- Copy guide assignments from the MANANA row to the new TARDE row
        INSERT INTO sendero_disponibilidad_guias (id, sendero_disponibilidad_id, guia_id, activo, fecha_asignacion)
        SELECT gen_random_uuid(), new_disp_id, guia_id, activo, CURRENT_TIMESTAMP
        FROM sendero_disponibilidad_guias
        WHERE sendero_disponibilidad_id = row_rec.id;

        RAISE NOTICE 'Duplicated availability for sendero % (MANANA → TARDE, new id: %)',
            row_rec.sendero_id, new_disp_id;
    END LOOP;
END $$;

-- ── 4. Make turno NOT NULL now that all rows have a value ─────────────────────
ALTER TABLE sendero_disponibilidad
    ALTER COLUMN turno SET NOT NULL;

-- ── 5. Enforce valid turno values ─────────────────────────────────────────────
ALTER TABLE sendero_disponibilidad
    DROP CONSTRAINT IF EXISTS chk_turno_valid;

ALTER TABLE sendero_disponibilidad
    ADD CONSTRAINT chk_turno_valid
        CHECK (turno IN ('MANANA', 'TARDE'));

-- ── 6. Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sdisponibilidad_sendero_turno_fecha
    ON sendero_disponibilidad(sendero_id, turno, fecha_inicio, fecha_fin)
    WHERE activo = true;

CREATE INDEX IF NOT EXISTS idx_sdisponibilidad_turno_fecha
    ON sendero_disponibilidad(turno, fecha_inicio, fecha_fin)
    WHERE activo = true;
