-- =====================================================================
-- SCALA - AGREGAR organizacion_id A TABLAS DE CAJA Y RECIBOS
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =====================================================================

-- 1. Agregar organizacion_id a recibos_cancelados (si no existe)
ALTER TABLE public.recibos_cancelados
ADD COLUMN IF NOT EXISTS organizacion_id UUID REFERENCES public.organizaciones(id) ON DELETE CASCADE;

-- 2. Agregar organizacion_id a recibos_detalle_cancelados (si no existe)
ALTER TABLE public.recibos_detalle_cancelados
ADD COLUMN IF NOT EXISTS organizacion_id UUID REFERENCES public.organizaciones(id) ON DELETE CASCADE;

-- 3. Migrar datos existentes: Poblar organizacion_id en recibos_cancelados
--    copiando el valor desde la tabla recibos (si el numero de recibo coincide)
UPDATE public.recibos_cancelados rc
SET organizacion_id = r.organizacion_id
FROM public.recibos r
WHERE rc.numero = r.numero
  AND rc.organizacion_id IS NULL
  AND r.organizacion_id IS NOT NULL;

-- 4. Migrar datos existentes: Poblar organizacion_id en recibos_detalle_cancelados
--    desde el encabezado del recibo cancelado
UPDATE public.recibos_detalle_cancelados rdc
SET organizacion_id = rc.organizacion_id
FROM public.recibos_cancelados rc
WHERE rdc.recibo_cancelado_id = rc.id
  AND rdc.organizacion_id IS NULL
  AND rc.organizacion_id IS NOT NULL;

-- 5. Asegurarse de que recibos también tiene el campo (ya debería, pero por seguridad)
ALTER TABLE public.recibos
ADD COLUMN IF NOT EXISTS organizacion_id UUID REFERENCES public.organizaciones(id) ON DELETE CASCADE;

-- 6. Asegurarse de que recibos_detalle también tiene el campo
ALTER TABLE public.recibos_detalle
ADD COLUMN IF NOT EXISTS organizacion_id UUID REFERENCES public.organizaciones(id) ON DELETE CASCADE;

-- 7. Migrar recibos_detalle desde recibos (si hay datos sin org)
UPDATE public.recibos_detalle rd
SET organizacion_id = r.organizacion_id
FROM public.recibos r
WHERE rd.recibo_id = r.id
  AND rd.organizacion_id IS NULL
  AND r.organizacion_id IS NOT NULL;

-- 8. Verificar resultados
SELECT 
    'recibos' as tabla,
    COUNT(*) as total,
    COUNT(organizacion_id) as con_org,
    COUNT(*) - COUNT(organizacion_id) as sin_org
FROM public.recibos
UNION ALL
SELECT 
    'recibos_cancelados',
    COUNT(*),
    COUNT(organizacion_id),
    COUNT(*) - COUNT(organizacion_id)
FROM public.recibos_cancelados
UNION ALL
SELECT 
    'recibos_detalle_cancelados',
    COUNT(*),
    COUNT(organizacion_id),
    COUNT(*) - COUNT(organizacion_id)
FROM public.recibos_detalle_cancelados;
