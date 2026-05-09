-- Script de Validación para Reposiciones en SCALA
-- Asegura que las reposiciones tengan observaciones obligatorias y estandariza la búsqueda.

-- 1. Añadir restricción CHECK para obligar a tener observaciones en Reposiciones
-- Nota: Usamos ILIKE para que no importe si envían con o sin tilde en la validación,
-- aunque la App enviará siempre "REPOSICIÓN".
ALTER TABLE asistencias 
DROP CONSTRAINT IF EXISTS check_reposicion_tiene_observacion;

ALTER TABLE asistencias 
ADD CONSTRAINT check_reposicion_tiene_observacion 
CHECK (
    NOT (observaciones ILIKE '%REPOSICIÓN%' AND (observaciones IS NULL OR length(trim(observaciones)) <= 10))
);

-- Comentario: La longitud <= 10 es porque la palabra "REPOSICIÓN" ya tiene 10 caracteres. 
-- Esto obliga a que el maestro escriba algo después de la palabra clave.

-- 2. Función para limpiar automáticamente prefijos duplicados (Refuerzo de integridad)
CREATE OR REPLACE FUNCTION fn_limpiar_asistencia_obs()
RETURNS TRIGGER AS $$
BEGIN
    -- Si por alguna razón llegan dos etiquetas, dejamos solo la última detectada
    IF NEW.observaciones ILIKE '%REPOSICIÓN%' AND NEW.observaciones ILIKE '%RETARDO%' THEN
        -- Priorizar REPOSICIÓN si detectamos ambas (regla de negocio: la reposición manda)
        NEW.observaciones := regexp_replace(NEW.observaciones, '(?i)RETARDO\s*(-)?\s*', '', 'g');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_limpiar_asistencia_obs ON asistencias;
CREATE TRIGGER trg_limpiar_asistencia_obs
BEFORE INSERT OR UPDATE ON asistencias
FOR EACH ROW EXECUTE FUNCTION fn_limpiar_asistencia_obs();
