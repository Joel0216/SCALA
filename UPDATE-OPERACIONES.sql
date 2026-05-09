-- ==============================================================================
-- SCRIPT DE MIGRACIÓN: REEMPLAZO DE LA TABLA "OPERACIONES"
-- 1. Elimina las vistas dependientes y la tabla "operaciones" original
-- 2. Crea la tabla "recibos_detalle" (antigua "operaciones") para el detalle del pago
-- 3. Crea la nueva tabla "operaciones" como un catálogo de cobros (sin stock)
-- 4. Recrea las vistas dependientes a las nuevas tablas
-- ==============================================================================

-- 1. Eliminar dependencias y la tabla antigua
DROP VIEW IF EXISTS v_recibos_detalle;

-- Advertencia: Esto elimina los detalles de recibos anteriores guardados en "operaciones"
DROP TABLE IF EXISTS operaciones CASCADE;

-- Ajustes de columnas en recibos para normalizar nombres y campos nuevos
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recibos' AND column_name='descuento_general') THEN
    ALTER TABLE recibos RENAME COLUMN descuento_general TO descuento;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recibos' AND column_name='cheque') THEN
    ALTER TABLE recibos RENAME COLUMN cheque TO tarjeta;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recibos' AND column_name='datos_cheque') THEN
    ALTER TABLE recibos RENAME COLUMN datos_cheque TO tarjeta_referencia;
  END IF;
END $$;

ALTER TABLE recibos ADD COLUMN IF NOT EXISTS precio_bruto DECIMAL(10,2);
ALTER TABLE recibos ADD COLUMN IF NOT EXISTS iva_porcentaje DECIMAL(5,2);
ALTER TABLE recibos ADD COLUMN IF NOT EXISTS monto_recibido DECIMAL(10,2);

-- Actualizar datos históricos (monto recibido = efectivo + tarjeta)
UPDATE recibos SET monto_recibido = COALESCE(efectivo,0) + COALESCE(tarjeta,0);

-- 2. Crear la tabla de detalles de los recibos (antigua tabla de operaciones transaccional)
-- Si ya existe, se conserva (para evitar errores en migraciones repetidas)
CREATE TABLE IF NOT EXISTS recibos_detalle (
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

-- Habilitar RLS en recibos_detalle (opcional, como lo tenías en operaciones)
ALTER TABLE recibos_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE recibos_detalle ADD COLUMN IF NOT EXISTS iva_rate DECIMAL(5,2) DEFAULT 0;

-- Políticas RLS para permitir lectura/insert/actualización/borrado desde el cliente (supabase anon/auth)
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

-- Índice recomendado para buscar detalles por recibo
CREATE INDEX IF NOT EXISTS idx_recibos_detalle_recibo ON recibos_detalle(recibo_id);
CREATE INDEX IF NOT EXISTS idx_recibos_detalle_alumno ON recibos_detalle(alumno_id);


-- 3. Crear el nuevo catálogo de operaciones
CREATE TABLE operaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(200) UNIQUE NOT NULL,
  precio DECIMAL(10,2) NOT NULL DEFAULT 0,
  iva DECIMAL(10,2) NOT NULL DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Comentarios del esquema
COMMENT ON TABLE recibos_detalle IS 'Detalle de las operaciones o conceptos cobrados en cada recibo.';
COMMENT ON TABLE operaciones IS 'Catálogo de operaciones y servicios a cobrar (sin inventario de stock).';

-- Datos iniciales sugeridos para el catálogo de operaciones (Ejemplo)
-- Puedes descomentarlos o modificarlos según los conceptos reales que manejan.
/*
INSERT INTO operaciones (nombre, precio, iva) VALUES 
('Colegiaturas', 0, 0),
('Examen de Nivel', 0, 0),
('Anualidad', 300, 48.00); 
*/


-- 4. Recrear dependencias y vistas
-- Recrear la vista v_recibos_detalle para que use la nueva tabla "recibos_detalle"
CREATE OR REPLACE VIEW v_recibos_detalle AS
SELECT 
    r.*,
    COUNT(rd.id) as num_operaciones,
    SUM(rd.neto) as total_calculado
FROM recibos r
LEFT JOIN recibos_detalle rd ON r.id = rd.recibo_id
GROUP BY r.id;


-- 5. Actualizar la tabla "operaciones_canceladas" si requería un constraint a recibos 
-- (No se modificó pero si usa campos iguales, asegurarse que funcionará igual)
-- No se requiere acción adicional por ahora.
