-- 11_fix_reservas_nullable_columns.sql
-- La tabla reservas usa SINGLE_TABLE inheritance (Hibernate).
-- SenderoReserva no tiene habitacion ni noches; AlojamientoReserva usa su propia tabla.
-- Las columnas numero_noches y habitacion_id no aplican a todos los tipos de reserva
-- y deben ser nullable para evitar constraint violations al insertar reservas de sendero.

ALTER TABLE reservas ALTER COLUMN numero_noches DROP NOT NULL;
ALTER TABLE reservas ALTER COLUMN habitacion_id DROP NOT NULL;
