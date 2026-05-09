-- ============================================
-- ESQUEMA PARA MOVIMIENTOS DE INVENTARIO
-- Estructura Maestro-Detalle
-- ============================================

-- Tabla de Tipos de Movimiento (Catálogo)
CREATE TABLE IF NOT EXISTS tipos_movimiento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clave VARCHAR(10) UNIQUE NOT NULL,
  descripcion VARCHAR(100) NOT NULL,
  afecta_inventario VARCHAR(10) NOT NULL, -- 'SUMA', 'RESTA', 'NINGUNO'
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insertar tipos de movimiento comunes
INSERT INTO tipos_movimiento (clave, descripcion, afecta_inventario) VALUES
('AD', 'ADQUISICION', 'SUMA'),
('C', 'COMPRA', 'SUMA'),
('S', 'SALIDA', 'RESTA'),
('V', 'VENTA', 'RESTA'),
('R', 'REINGRESO', 'SUMA'),
('AJ+', 'AJUSTE POSITIVO', 'SUMA'),
('AJ-', 'AJUSTE NEGATIVO', 'RESTA'),
('DEV', 'DEVOLUCION', 'SUMA'),
('MER', 'MERMA', 'RESTA'),
('DON', 'DONACION', 'RESTA')
ON CONFLICT (clave) DO NOTHING;

-- Tabla Maestro: Movimientos de Inventario (Cabecera)
CREATE TABLE IF NOT EXISTS movimientos_inventario_maestro (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero SERIAL UNIQUE NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  hora TIME NOT NULL DEFAULT CURRENT_TIME,
  tipo_movimiento_id UUID REFERENCES tipos_movimiento(id),
  observaciones TEXT,
  usuario_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla Detalle: Movimientos de Inventario (Renglones)
CREATE TABLE IF NOT EXISTS movimientos_inventario_detalle (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  movimiento_id UUID REFERENCES movimientos_inventario_maestro(id) ON DELETE CASCADE,
  articulo_id BIGINT REFERENCES articulos(id),
  cantidad INTEGER NOT NULL,
  precio_unitario DECIMAL(10,2),
  total DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_mov_inv_det_movimiento ON movimientos_inventario_detalle(movimiento_id);
CREATE INDEX IF NOT EXISTS idx_mov_inv_det_articulo ON movimientos_inventario_detalle(articulo_id);
CREATE INDEX IF NOT EXISTS idx_mov_inv_maestro_fecha ON movimientos_inventario_maestro(fecha);
CREATE INDEX IF NOT EXISTS idx_mov_inv_maestro_numero ON movimientos_inventario_maestro(numero);

-- Función para actualizar stock automáticamente
CREATE OR REPLACE FUNCTION actualizar_stock_inventario()
RETURNS TRIGGER AS $$
DECLARE
    tipo_afecta VARCHAR(10);
    cantidad_cambio INTEGER;
BEGIN
    -- Obtener el tipo de movimiento y cómo afecta el inventario
    SELECT tm.afecta_inventario INTO tipo_afecta
    FROM movimientos_inventario_maestro mim
    JOIN tipos_movimiento tm ON mim.tipo_movimiento_id = tm.id
    WHERE mim.id = NEW.movimiento_id;
    
    -- Calcular el cambio en la cantidad
    IF TG_OP = 'INSERT' THEN
        cantidad_cambio = NEW.cantidad;
    ELSIF TG_OP = 'UPDATE' THEN
        cantidad_cambio = NEW.cantidad - OLD.cantidad;
    ELSIF TG_OP = 'DELETE' THEN
        cantidad_cambio = -OLD.cantidad;
    END IF;
    
    -- Actualizar el stock según el tipo de movimiento
    IF tipo_afecta = 'SUMA' THEN
        UPDATE articulos 
        SET existencia = existencia + cantidad_cambio,
            updated_at = NOW()
        WHERE id = COALESCE(NEW.articulo_id, OLD.articulo_id);
    ELSIF tipo_afecta = 'RESTA' THEN
        UPDATE articulos 
        SET existencia = existencia - cantidad_cambio,
            updated_at = NOW()
        WHERE id = COALESCE(NEW.articulo_id, OLD.articulo_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar stock automáticamente
DROP TRIGGER IF EXISTS trigger_actualizar_stock ON movimientos_inventario_detalle;
CREATE TRIGGER trigger_actualizar_stock
AFTER INSERT OR UPDATE OR DELETE ON movimientos_inventario_detalle
FOR EACH ROW
EXECUTE FUNCTION actualizar_stock_inventario();

-- Comentarios para documentación
COMMENT ON TABLE tipos_movimiento IS 'Catálogo de tipos de movimiento de inventario';
COMMENT ON TABLE movimientos_inventario_maestro IS 'Cabecera de movimientos de inventario (Maestro)';
COMMENT ON TABLE movimientos_inventario_detalle IS 'Detalle de artículos por movimiento (Detalle)';
COMMENT ON COLUMN tipos_movimiento.afecta_inventario IS 'SUMA: aumenta stock, RESTA: disminuye stock, NINGUNO: no afecta';
