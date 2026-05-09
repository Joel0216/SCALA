-- ============================================
-- SCHEMA: Tabla de Artículos (Compatible con Supabase)
-- ============================================
-- Autor: Sistema SCALA
-- Fecha: 2026-02-15
-- Descripción: Tabla para gestión de inventario de artículos
-- Nota: Esta tabla se integra con grupos_articulos existente
-- ============================================

-- La tabla grupos_articulos YA EXISTE en Supabase con estos valores:
-- ('INSTRUMENTOS', 'ACCESORIOS', 'LIBROS', 'CUERDAS', 'BAQUETAS', 
--  'ATRILES', 'ESTUCHES', 'AUDIO', 'UNIFORMES', 'PAPELERIA')

-- Eliminar tabla si existe (para desarrollo)
DROP TABLE IF EXISTS articulos CASCADE;

-- Crear tabla de artícu los
CREATE TABLE IF NOT EXISTS articulos (
    id BIGSERIAL PRIMARY KEY,
    clave TEXT UNIQUE NOT NULL,
    descripcion TEXT NOT NULL,
    grupo TEXT NOT NULL,  -- Cambio: ahora es TEXT simple, sin FK
    precio NUMERIC(10,2) NOT NULL DEFAULT 0,
    iva NUMERIC(4,2) NOT NULL DEFAULT 0.16,
    stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_articulos_clave ON articulos(clave);
CREATE INDEX IF NOT EXISTS idx_articulos_descripcion ON articulos(descripcion);
CREATE INDEX IF NOT EXISTS idx_articulos_grupo ON articulos(grupo);

-- Comentarios
COMMENT ON TABLE articulos IS 'Tabla de artículos para inventario';
COMMENT ON COLUMN articulos.clave IS 'Código único del artículo';
COMMENT ON COLUMN articulos.descripcion IS 'Descripción del artículo';
COMMENT ON COLUMN articulos.grupo IS 'Categoría del artículo (texto libre)';
COMMENT ON COLUMN articulos.precio IS 'Precio de venta del artículo';
COMMENT ON COLUMN articulos.iva IS 'Porcentaje de IVA (default 0.16 = 16%)';
COMMENT ON COLUMN articulos.stock IS 'Cantidad en existencia';
