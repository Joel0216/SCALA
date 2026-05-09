-- Actualizar tabla de alumnos con campos de beca
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS beca BOOLEAN DEFAULT FALSE;
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS porcentaje_beca NUMERIC DEFAULT 0;

-- Actualizar tabla de recibos_detalle para historial de becas
ALTER TABLE recibos_detalle ADD COLUMN IF NOT EXISTS beca_aplicada BOOLEAN DEFAULT FALSE;
ALTER TABLE recibos_detalle ADD COLUMN IF NOT EXISTS porcentaje_beca NUMERIC DEFAULT 0;

-- Opcional: Asegurarse de que el campo cupo y alumnos_inscritos existan en grupos si no están
-- (Basado en la lógica vista en alumnos.js)
-- ALTER TABLE grupos ADD COLUMN IF NOT EXISTS cupo INTEGER DEFAULT 0;
-- ALTER TABLE grupos ADD COLUMN IF NOT EXISTS alumnos_inscritos INTEGER DEFAULT 0;
