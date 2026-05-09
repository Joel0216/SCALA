-- ============================================
-- SCHEMA: Tablas para Recibos Cancelados
-- ============================================
-- Descripción: Almacena el historial de recibos cancelados para auditoría.

-- 1. Tabla de Cabeceras Canceladas
CREATE TABLE IF NOT EXISTS recibos_cancelados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_id UUID, -- ID original del recibo (UUID)
    numero INTEGER NOT NULL,
    fecha_recibo TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_cancelacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cliente_nombre TEXT,
    cliente_rfc TEXT,
    metodo_pago TEXT,
    total NUMERIC(15,2),
    subtotal NUMERIC(15,2),
    descuento NUMERIC(15,2),
    comprobante_url TEXT,
    usuario_cancela TEXT,
    motivo_cancelacion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Detalles Cancelados
CREATE TABLE IF NOT EXISTS recibos_detalle_cancelados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recibo_cancelado_id UUID REFERENCES recibos_cancelados(id) ON DELETE CASCADE,
    credencial TEXT,
    operacion TEXT,
    articulo_id BIGINT, -- Para referencia a stock si se necesitara re-auditar
    cantidad INTEGER,
    monto_unitario NUMERIC(15,2),
    neto NUMERIC(15,2),
    descuento_porcentaje NUMERIC(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_rec_canc_numero ON recibos_cancelados(numero);
CREATE INDEX IF NOT EXISTS idx_rec_canc_cliente ON recibos_cancelados(cliente_nombre);
CREATE INDEX IF NOT EXISTS idx_det_canc_credencial ON recibos_detalle_cancelados(credencial);

-- RLS (Habilitar si es necesario)
ALTER TABLE recibos_cancelados ENABLE ROW LEVEL SECURITY;
ALTER TABLE recibos_detalle_cancelados ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (asumiendo autenticación previa)
CREATE POLICY "Permitir lectura para todos los autenticados_canc" ON recibos_cancelados FOR SELECT USING (true);
CREATE POLICY "Permitir inserción para todos los autenticados_canc" ON recibos_cancelados FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir lectura detalle para todos los autenticados_canc" ON recibos_detalle_cancelados FOR SELECT USING (true);
CREATE POLICY "Permitir inserción detalle para todos los autenticados_canc" ON recibos_detalle_cancelados FOR INSERT WITH CHECK (true);
