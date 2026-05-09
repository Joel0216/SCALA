-- Migration: Add payment metadata columns to 'recibos' table
ALTER TABLE recibos ADD COLUMN IF NOT EXISTS metodo_pago TEXT;
ALTER TABLE recibos ADD COLUMN IF NOT EXISTS trans_folio TEXT;
ALTER TABLE recibos ADD COLUMN IF NOT EXISTS trans_razon_social TEXT;
ALTER TABLE recibos ADD COLUMN IF NOT EXISTS trans_rfc TEXT;
ALTER TABLE recibos ADD COLUMN IF NOT EXISTS trans_concepto TEXT;
ALTER TABLE recibos ADD COLUMN IF NOT EXISTS tarjeta_banco TEXT;
ALTER TABLE recibos ADD COLUMN IF NOT EXISTS tarjeta_numero TEXT;
ALTER TABLE recibos ADD COLUMN IF NOT EXISTS cambio_monto NUMERIC DEFAULT 0;
ALTER TABLE recibos ADD COLUMN IF NOT EXISTS comprobante_url TEXT;

-- Optional: Add a comment to columns for better DB documentation
COMMENT ON COLUMN recibos.metodo_pago IS 'EFECTIVO, TARJETA, TRANSFERENCIA';
COMMENT ON COLUMN recibos.trans_folio IS 'Folio/Referencia de transferencia';
COMMENT ON COLUMN recibos.tarjeta_numero IS 'Últimos 4 dígitos o número completo de tarjeta';
