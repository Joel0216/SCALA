-- ==============================================================================
-- FIX-CANCELLED-MULTI-TENANT.sql
-- Academia SCALA - SaaS Multi-tenant
-- ==============================================================================
-- Propósito: Modificar las tablas de recibos cancelados para soportar multi-tenencia.
-- ==============================================================================

DO $$ 
BEGIN

    -- 1. Asegurar que existe organizacion_id en recibos_cancelados
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recibos_cancelados' AND column_name = 'organizacion_id') THEN
        ALTER TABLE recibos_cancelados ADD COLUMN organizacion_id UUID;
    END IF;

    -- 2. Asegurar que existe organizacion_id en recibos_detalle_cancelados
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recibos_detalle_cancelados' AND column_name = 'organizacion_id') THEN
        ALTER TABLE recibos_detalle_cancelados ADD COLUMN organizacion_id UUID;
    END IF;

    -- 3. Corregir restricción de unicidad de folios cancelados
    ALTER TABLE recibos_cancelados DROP CONSTRAINT IF EXISTS unique_folio_cancelado CASCADE;
    ALTER TABLE recibos_cancelados DROP CONSTRAINT IF EXISTS recibos_cancelados_numero_key CASCADE;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recibos_cancelados_numero_org_unique') THEN
        ALTER TABLE recibos_cancelados ADD CONSTRAINT recibos_cancelados_numero_org_unique UNIQUE (numero, organizacion_id);
    END IF;

END $$;
