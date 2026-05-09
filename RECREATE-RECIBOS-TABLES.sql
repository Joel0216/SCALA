-- RECREATE-RECIBOS-TABLES.sql
-- Ejecutar en Supabase / Postgres para recrear las tablas de recibos (cabecera + detalle)
-- ADVERTENCIA: esto BORRA datos existentes en las tablas mencionadas.

-- 1) Eliminar dependencias y tablas existentes
DROP VIEW IF EXISTS v_recibos_detalle;
DROP TABLE IF EXISTS recibos_detalle CASCADE;
DROP TABLE IF EXISTS recibos CASCADE;

-- 2) Crear tabla "recibos" (cabecera)
CREATE TABLE recibos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero SERIAL UNIQUE NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  hora TIME NOT NULL DEFAULT CURRENT_TIME,
  precio_bruto DECIMAL(10,2) DEFAULT 0,
  subtotal DECIMAL(10,2) DEFAULT 0,
  descuento DECIMAL(10,2) DEFAULT 0,
  iva DECIMAL(10,2) DEFAULT 0,
  iva_porcentaje DECIMAL(5,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  efectivo DECIMAL(10,2) DEFAULT 0,
  tarjeta DECIMAL(10,2) DEFAULT 0,
  tarjeta_referencia TEXT,
  monto_recibido DECIMAL(10,2) DEFAULT 0,
  requiere_factura BOOLEAN DEFAULT false,
  rfc_factura VARCHAR(13),
  nombre_factura VARCHAR(200),
  direccion_factura TEXT,
  cancelado BOOLEAN DEFAULT false,
  fecha_cancelacion TIMESTAMP,
  motivo_cancelacion TEXT,
  usuario_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3) Crear tabla "recibos_detalle" (detalle de operaciones por recibo)
CREATE TABLE recibos_detalle (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recibo_id UUID REFERENCES recibos(id) ON DELETE CASCADE,
  operacion TEXT NOT NULL,
  tipo VARCHAR(50),
  credencial VARCHAR(10),
  alumno_id INTEGER REFERENCES alumnos(id),
  grupo VARCHAR(20),
  cantidad INTEGER DEFAULT 1,
  monto DECIMAL(10,2) NOT NULL,
  descuento DECIMAL(10,2) DEFAULT 0,
  iva DECIMAL(10,2) DEFAULT 0,
  iva_rate DECIMAL(5,2) DEFAULT 0,
  neto DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4) Habilitar RLS y políticas (para Supabase)
ALTER TABLE recibos_detalle ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'enable_read_access_for_all_users' AND polrelid = 'recibos_detalle'::regclass) THEN
    CREATE POLICY enable_read_access_for_all_users ON public.recibos_detalle
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'enable_insert_access_for_all_users' AND polrelid = 'recibos_detalle'::regclass) THEN
    CREATE POLICY enable_insert_access_for_all_users ON public.recibos_detalle
      FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'enable_update_access_for_all_users' AND polrelid = 'recibos_detalle'::regclass) THEN
    CREATE POLICY enable_update_access_for_all_users ON public.recibos_detalle
      FOR UPDATE
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'enable_delete_access_for_all_users' AND polrelid = 'recibos_detalle'::regclass) THEN
    CREATE POLICY enable_delete_access_for_all_users ON public.recibos_detalle
      FOR DELETE
      USING (true);
  END IF;
END $$;

-- 5) Crear la vista de resumen de recibos
CREATE OR REPLACE VIEW v_recibos_detalle AS
SELECT 
    r.*,
    COUNT(rd.id) as num_operaciones,
    SUM(rd.neto) as total_calculado
FROM recibos r
LEFT JOIN recibos_detalle rd ON r.id = rd.recibo_id
GROUP BY r.id;
