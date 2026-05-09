-- Add missing auditing columns to recibos_cancelados
ALTER TABLE recibos_cancelados 
ADD COLUMN IF NOT EXISTS iva NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS monto_recibido NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS cambio_monto NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS direccion_factura TEXT,
ADD COLUMN IF NOT EXISTS trans_folio TEXT,
ADD COLUMN IF NOT EXISTS trans_razon_social TEXT,
ADD COLUMN IF NOT EXISTS trans_rfc TEXT,
ADD COLUMN IF NOT EXISTS trans_concepto TEXT,
ADD COLUMN IF NOT EXISTS tarjeta_referencia TEXT,
ADD COLUMN IF NOT EXISTS tarjeta_banco TEXT,
ADD COLUMN IF NOT EXISTS tarjeta_numero TEXT;
