-- 09_guias_seed.sql
-- Seed guide data for sendero reservations
-- Guides are internal-only; users never see or select them

-- Insert guides if not already present
INSERT INTO guias (id, nombre, apellido, email, biografia, anos_experiencia, especialidades, activo, fecha_creacion)
SELECT gen_random_uuid(), 'Laura', 'Magallanes', 'laura@tinambu.com',
       'Guía especializada en flora y fauna del Paso Centurión', 5,
       'Aves, Flora nativa, Senderismo', true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM guias WHERE email = 'laura@tinambu.com');

INSERT INTO guias (id, nombre, apellido, email, biografia, anos_experiencia, especialidades, activo, fecha_creacion)
SELECT gen_random_uuid(), 'Francisco', 'Rodriguez', 'francisco@tinambu.com',
       'Guía de naturaleza y observación de aves', 3,
       'Aves, Mamíferos, Senderismo', true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM guias WHERE email = 'francisco@tinambu.com');
