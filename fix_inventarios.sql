-- ==============================================================================
-- MIGRACIÓN: REESTRUCTURACIÓN DE INVENTARIOS (V5 DEFINITIVO)
-- ==============================================================================

-- 1. Corregir tipos_movimiento
ALTER TABLE tipos_movimiento ADD COLUMN IF NOT EXISTS afecta_inventario VARCHAR(20) DEFAULT 'NINGUNO';

-- Intentar poblar basándose en las descripciones si están vacíos
UPDATE tipos_movimiento SET afecta_inventario = 'SUMA' WHERE clave IN ('ENT', 'E', 'ENTRADA') OR descripcion ILIKE '%ENTRADA%' OR descripcion ILIKE '%SUMA%';
UPDATE tipos_movimiento SET afecta_inventario = 'RESTA' WHERE clave IN ('SAL', 'S', 'SALIDA') OR descripcion ILIKE '%SALIDA%' OR descripcion ILIKE '%RESTA%';
UPDATE tipos_movimiento SET afecta_inventario = 'NINGUNO' WHERE afecta_inventario IS NULL;

-- 2. Crear la tabla unificada movimientos_inventario (si no existe)
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero INTEGER NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    hora TIME NOT NULL DEFAULT CURRENT_TIME,
    tipo_id VARCHAR(50), -- Guarda la CLAVE del tipo
    articulo_id UUID REFERENCES articulos(id),
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10,2),
    iva_importe DECIMAL(10,2) DEFAULT 0,
    total_linea DECIMAL(10,2),
    total DECIMAL(10,2),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Desactivar RLS para permitir inserciones desde la app
ALTER TABLE movimientos_inventario DISABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_movimiento DISABLE ROW LEVEL SECURITY;
ALTER TABLE articulos DISABLE ROW LEVEL SECURITY;
ALTER TABLE grupos_articulos DISABLE ROW LEVEL SECURITY;

-- Otorgar permisos explícitos a todos los roles
GRANT ALL ON TABLE movimientos_inventario TO anon, authenticated, service_role;
GRANT ALL ON TABLE tipos_movimiento TO anon, authenticated, service_role;
GRANT ALL ON TABLE articulos TO anon, authenticated, service_role;
GRANT ALL ON TABLE grupos_articulos TO anon, authenticated, service_role;

-- Crear política de respaldo (por si RLS se vuelve a activar)
DROP POLICY IF EXISTS "Permitir todo" ON movimientos_inventario;
CREATE POLICY "Permitir todo" ON movimientos_inventario FOR ALL USING (true) WITH CHECK (true);

-- Crear la relación formal para que Supabase pueda unir las tablas (Sincro con JS)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_clave_tipo') THEN
        ALTER TABLE tipos_movimiento ADD CONSTRAINT unique_clave_tipo UNIQUE (clave);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_movimientos_tipo') THEN
        ALTER TABLE movimientos_inventario ADD CONSTRAINT fk_movimientos_tipo FOREIGN KEY (tipo_id) REFERENCES tipos_movimiento(clave);
    END IF;
END $$;

-- 3. Trigger para actualización de stock AUTOMÁTICA
CREATE OR REPLACE FUNCTION funcion_actualizar_stock_v5()
RETURNS TRIGGER AS $$
DECLARE
    v_afecta VARCHAR(20);
BEGIN
    -- Buscamos el comportamiento del tipo de movimiento por su clave
    SELECT afecta_inventario INTO v_afecta FROM tipos_movimiento WHERE clave = NEW.tipo_id;
    
    IF v_afecta = 'SUMA' THEN
        UPDATE articulos SET stock = COALESCE(stock, 0) + NEW.cantidad WHERE id = NEW.articulo_id;
    ELSIF v_afecta = 'RESTA' THEN
        UPDATE articulos SET stock = COALESCE(stock, 0) - NEW.cantidad WHERE id = NEW.articulo_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_stock_v5 ON movimientos_inventario;
CREATE TRIGGER trigger_stock_v5
AFTER INSERT ON movimientos_inventario
FOR EACH ROW EXECUTE FUNCTION funcion_actualizar_stock_v5();

-- 4. Trigger para REVERTIR stock al borrar
CREATE OR REPLACE FUNCTION funcion_revertir_stock_v5()
RETURNS TRIGGER AS $$
DECLARE
    v_afecta VARCHAR(20);
BEGIN
    SELECT afecta_inventario INTO v_afecta FROM tipos_movimiento WHERE clave = OLD.tipo_id;
    
    IF v_afecta = 'SUMA' THEN
        UPDATE articulos SET stock = COALESCE(stock, 0) - OLD.cantidad WHERE id = OLD.articulo_id;
    ELSIF v_afecta = 'RESTA' THEN
        UPDATE articulos SET stock = COALESCE(stock, 0) + OLD.cantidad WHERE id = OLD.articulo_id;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_revertir_stock_v5 ON movimientos_inventario;
CREATE TRIGGER trigger_revertir_stock_v5
BEFORE DELETE ON movimientos_inventario
FOR EACH ROW EXECUTE FUNCTION funcion_revertir_stock_v5();

-- 5. Función para RENUMERAR (RPC)
CREATE OR REPLACE FUNCTION renumerar_movimientos_flat(p_numero_borrado INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE movimientos_inventario
    SET numero = numero - 1
    WHERE numero > p_numero_borrado;
END;
$$ LANGUAGE plpgsql;
