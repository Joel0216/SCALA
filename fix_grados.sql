-- 1. Función para obtener el grado numérico desde el curso
CREATE OR REPLACE FUNCTION fn_obtener_grado_curso(p_curso_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_grado_txt TEXT;
BEGIN
    SELECT grado INTO v_grado_txt FROM cursos WHERE id = p_curso_id;
    
    IF v_grado_txt IS NULL THEN RETURN 1;
    END IF;

    IF v_grado_txt ILIKE '%PRIM%' THEN RETURN 1;
    ELSIF v_grado_txt ILIKE '%SEG%' THEN RETURN 2;
    ELSIF v_grado_txt ILIKE '%TER%' THEN RETURN 3;
    ELSIF v_grado_txt ILIKE '%CUA%' THEN RETURN 4;
    ELSIF v_grado_txt ILIKE '%QUI%' THEN RETURN 5;
    ELSIF v_grado_txt ILIKE '%SEX%' THEN RETURN 6;
    ELSE
        -- Intentar convertir a número directamente (si es "1", "2", etc.)
        BEGIN
            RETURN COALESCE(NULLIF(regexp_replace(v_grado_txt, '\D', '', 'g'), '')::INTEGER, 1);
        EXCEPTION WHEN OTHERS THEN
            RETURN 1;
        END;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger para grupos: auto-asignar grado al crear según el curso
CREATE OR REPLACE FUNCTION tr_grupos_auto_grado()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el grado es 1 (default) o nulo, intentamos traer el del curso
    IF NEW.grado IS NULL OR NEW.grado = 1 THEN
        NEW.grado = fn_obtener_grado_curso(NEW.curso_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_grupos_grado ON grupos;
CREATE TRIGGER trigger_grupos_grado
BEFORE INSERT OR UPDATE OF curso_id ON grupos
FOR EACH ROW EXECUTE FUNCTION tr_grupos_auto_grado();

-- 3. Trigger para alumno_grupos: auto-asignar grado al inscribir
CREATE OR REPLACE FUNCTION tr_alumno_grupos_auto_grado()
RETURNS TRIGGER AS $$
BEGIN
    -- El alumno toma el grado que tiene definido el grupo (que a su vez viene del curso)
    SELECT g.grado INTO NEW.grado 
    FROM grupos g 
    WHERE g.clave = NEW.grupo_clave;
    
    IF NEW.grado IS NULL THEN NEW.grado = 1; END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_alumno_grupos_grado ON alumno_grupos;
CREATE TRIGGER trigger_alumno_grupos_grado
BEFORE INSERT ON alumno_grupos
FOR EACH ROW EXECUTE FUNCTION tr_alumno_grupos_auto_grado();

-- 4. Notificar
NOTIFY pgrst, 'reload schema';
