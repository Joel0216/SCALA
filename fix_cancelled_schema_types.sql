-- ============================================
-- FIX: Schema Type Mismatch (UUID vs BigInt)
-- ============================================

-- Change original_id from BIGINT to UUID in recibos_cancelados
ALTER TABLE recibos_cancelados 
ALTER COLUMN original_id TYPE UUID USING original_id::text::uuid;

-- If original_id was empty/null, simple ALTER works:
-- ALTER TABLE recibos_cancelados ALTER COLUMN original_id TYPE UUID;

-- Verify articulo_id in details (keep as BIGINT but allow nulls)
ALTER TABLE recibos_detalle_cancelados
ALTER COLUMN articulo_id TYPE BIGINT; -- Should already be BIGINT

-- Drop potentially conflicting old logic if any
-- Ensure column names match cobros.js mapping

