-- Agregar la columna tipo_examen a la tabla cursos para vincular examenes a cursos
-- Primero verificar si ya existe (en caso de que se ejecute dos veces)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'cursos' AND column_name = 'tipo_examen'
    ) THEN
        ALTER TABLE cursos ADD COLUMN tipo_examen VARCHAR(100) DEFAULT NULL;
        COMMENT ON COLUMN cursos.tipo_examen IS 'Tipo de examen al que pertenece el curso (e.g. BATERIA, LECTURA, TEORIA)';
    END IF;
END $$;
