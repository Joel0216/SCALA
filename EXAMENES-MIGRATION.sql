-- ============================================================
-- MIGRACIÓN: Sistema de Exámenes - Mejoras
-- Ejecutar en el panel SQL de Supabase
-- ============================================================

-- 1. Agregar columnas a programacion_examenes
ALTER TABLE programacion_examenes 
  ADD COLUMN IF NOT EXISTS grupo_id UUID REFERENCES grupos(id),
  ADD COLUMN IF NOT EXISTS clave_acceso TEXT;

-- 2. Crear tabla resultados_examen
CREATE TABLE IF NOT EXISTS resultados_examen (
  id BIGSERIAL PRIMARY KEY,
  clave_examen TEXT NOT NULL,
  alumno_id BIGINT REFERENCES alumnos(id),
  presento BOOLEAN DEFAULT false,
  aprobo BOOLEAN DEFAULT false,
  calificacion NUMERIC(5,2),
  maestro_calificador_id BIGINT REFERENCES maestros(id),
  credencial_maestro TEXT,
  hora_calificacion TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Deshabilitar RLS en resultados_examen
ALTER TABLE resultados_examen DISABLE ROW LEVEL SECURITY;

-- 4. Índices útiles
CREATE INDEX IF NOT EXISTS idx_resultados_clave ON resultados_examen(clave_examen);
CREATE INDEX IF NOT EXISTS idx_resultados_alumno ON resultados_examen(alumno_id);
CREATE INDEX IF NOT EXISTS idx_prog_examen_grupo ON programacion_examenes(grupo_id);

-- ============================================================
-- FUNCIÓN para verificar si un salón está disponible en fecha/hora
-- (toma en cuenta exámenes Y sesiones de clase con ventana de 2 horas)
-- ============================================================
CREATE OR REPLACE FUNCTION check_salon_examen_disponible(
  p_salon TEXT,
  p_fecha DATE,
  p_hora TIME,
  p_excluir_clave TEXT DEFAULT NULL  -- para reasignación excluir el propio examen
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_hora_fin TIME := p_hora + INTERVAL '2 hours';
  v_conflicto_examen RECORD;
BEGIN
  -- Buscar exámenes en ese salón en esa fecha que se superpongan
  SELECT clave_examen, hora INTO v_conflicto_examen
  FROM programacion_examenes
  WHERE 
    salon_id::TEXT = p_salon
    AND fecha = p_fecha
    AND (p_excluir_clave IS NULL OR clave_examen != p_excluir_clave)
    AND alumno_id IS NULL  -- solo encabezados
    AND hora IS NOT NULL
    AND (
      -- El examen existente empieza antes de que termine el nuevo y termina después de que empiece el nuevo
      hora < v_hora_fin AND (hora + INTERVAL '2 hours') > p_hora
    )
  LIMIT 1;

  IF v_conflicto_examen IS NOT NULL THEN
    RETURN jsonb_build_object(
      'disponible', false,
      'motivo', format('Hay un examen (clave %s) a las %s en ese salón', v_conflicto_examen.clave_examen, v_conflicto_examen.hora)
    );
  END IF;

  RETURN jsonb_build_object('disponible', true, 'motivo', '');
END;
$$;
