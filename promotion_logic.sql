-- Function to handle cycle closure and student promotions
CREATE OR REPLACE FUNCTION cerrar_ciclo_escolar(p_grupo_id UUID)
RETURNS TABLE (
    alumnos_promovidos INTEGER,
    alumnos_retenidos INTEGER
) AS $$
DECLARE
    v_promovidos INTEGER := 0;
    v_retenidos INTEGER := 0;
BEGIN
    -- 1. Promover alumnos con calificación >= 70
    -- Nota: Esta lógica asume que la calificación final se calcula o se toma de la tabla de calificaciones
    -- Para este script, usaremos la calificación de la tabla alumnos si existe, o la última del examen.
    
    -- Actualizar alumnos que APRUEBAN (>= 70)
    UPDATE alumnos 
    SET 
        grado = CASE 
            WHEN grado ~ '^[0-9]+$' AND CAST(grado AS INTEGER) < 6 THEN CAST(CAST(grado AS INTEGER) + 1 AS TEXT)
            ELSE grado -- Si ya es 6 o no es numérico, se queda igual o se maneja graduación
        END,
        status = 'promovido',
        updated_at = NOW()
    WHERE grupo_id = p_grupo_id 
      AND id IN (
          SELECT alumno_id 
          FROM calificaciones_examen ce
          JOIN examenes e ON ce.examen_id = e.id
          WHERE e.grupo_id = p_grupo_id
          AND ce.calificacion >= 70
      );
    
    GET DIAGNOSTICS v_promovidos = ROW_COUNT;

    -- 2. Retener alumnos que REPRUEBAN (< 70)
    -- Permanecen en el grupo actual (o se marcan para el siguiente ciclo en el mismo grado)
    UPDATE alumnos
    SET 
        status = 'retenido',
        updated_at = NOW()
    WHERE grupo_id = p_grupo_id
      AND id NOT IN (
          SELECT alumno_id 
          FROM calificaciones_examen ce
          JOIN examenes e ON ce.examen_id = e.id
          WHERE e.grupo_id = p_grupo_id
          AND ce.calificacion >= 70
      );

    GET DIAGNOSTICS v_retenidos = ROW_COUNT;

    -- 3. Desactivar el grupo actual
    UPDATE grupos 
    SET status = 'cerrado', updated_at = NOW() 
    WHERE id = p_grupo_id;

    RETURN QUERY SELECT v_promovidos, v_retenidos;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cerrar_ciclo_escolar IS 'Handles the promotion of students based on their grades and closes the group';
