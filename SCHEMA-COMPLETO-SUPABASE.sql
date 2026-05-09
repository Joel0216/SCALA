-- ============================================
-- SCHEMA COMPLETO PARA SISTEMA SCALA
-- Academia de Música - Supabase PostgreSQL
-- ============================================
-- 
-- CREDENCIALES SUPABASE:
-- URL: https://vqsduyfkgdqnigzkxazk.supabase.co
-- Publishable key: sb_publishable_G3pShpufiLpsHC_dCoFe-g_NpLMu1XJ
-- Anon Public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxc2R1eWZrZ2Rxbmlnemt4YXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMzIyOTMsImV4cCI6MjA4NDYwODI5M30.l5bZubjb3PIvcFG43JTfoeguldEwwIK7wlnOnl-Ec5o
-- Service Role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxc2R1eWZrZ2Rxbmlnemt4YXprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTAzMjI5MywiZXhwIjoyMDg0NjA4MjkzfQ.pJYF22jk58y7n-pk1KLOItItPYiz5o3h4Tb7Q3FUDL0
--
-- ============================================

-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLAS DE CATÁLOGOS
-- ============================================

-- Motivos de Baja
CREATE TABLE IF NOT EXISTS motivos_baja (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clave VARCHAR(10) UNIQUE NOT NULL,
  descripcion VARCHAR(200) NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Instrumentos
CREATE TABLE IF NOT EXISTS instrumentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clave VARCHAR(10) UNIQUE NOT NULL,
  descripcion VARCHAR(200) NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Medios de Contacto
CREATE TABLE IF NOT EXISTS medios_contacto (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clave VARCHAR(10) UNIQUE NOT NULL,
  descripcion VARCHAR(200) NOT NULL,
  tipo VARCHAR(50),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Salones
CREATE TABLE IF NOT EXISTS salones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero VARCHAR(20) UNIQUE NOT NULL,
  ubicacion VARCHAR(200),
  cupo INTEGER DEFAULT 10,
  instrumentos TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tipos de Movimiento de Inventario
CREATE TABLE IF NOT EXISTS tipos_movimiento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clave VARCHAR(10) UNIQUE NOT NULL,
  descripcion VARCHAR(200) NOT NULL,
  afecta_inventario BOOLEAN DEFAULT true,
  tipo VARCHAR(20) NOT NULL, -- 'ENTRADA', 'SALIDA', 'AJUSTE'
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLAS MAESTRAS
-- ============================================

-- Cursos
CREATE TABLE IF NOT EXISTS cursos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  curso VARCHAR(100) UNIQUE NOT NULL,
  descripcion TEXT,
  duracion_meses INTEGER,
  precio_mensual DECIMAL(10,2),
  precio_inscripcion DECIMAL(10,2),
  nivel VARCHAR(50),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Maestros
CREATE TABLE IF NOT EXISTS maestros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(200) NOT NULL,
  clave VARCHAR(20) UNIQUE,
  direccion VARCHAR(300),
  telefono VARCHAR(20),
  celular VARCHAR(20),
  email VARCHAR(150),
  rfc VARCHAR(13),
  grado VARCHAR(100),
  detalles_grado TEXT,
  fecha_ingreso DATE,
  fecha_baja DATE,
  status VARCHAR(20) DEFAULT 'activo',
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Grupos
CREATE TABLE IF NOT EXISTS grupos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clave VARCHAR(20) UNIQUE NOT NULL,
  curso_id UUID REFERENCES cursos(id),
  maestro_id UUID REFERENCES maestros(id),
  salon_id UUID REFERENCES salones(id),
  dia VARCHAR(2),
  hora_entrada TIME,
  hora_salida TIME,
  cupo INTEGER DEFAULT 10,
  alumnos_inscritos INTEGER DEFAULT 0,
  inicio DATE,
  leccion VARCHAR(50),
  fecha_leccion DATE,
  status VARCHAR(20) DEFAULT 'activo',
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Alumnos
CREATE TABLE IF NOT EXISTS alumnos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credencial1 VARCHAR(10) UNIQUE NOT NULL,
  credencial2 VARCHAR(10),
  nombre VARCHAR(200) NOT NULL,
  apellidos VARCHAR(200),
  edad INTEGER,
  fecha_nacimiento DATE,
  direccion1 VARCHAR(300),
  direccion2 VARCHAR(300),
  ciudad VARCHAR(100),
  codigo_postal VARCHAR(10),
  telefono VARCHAR(20),
  celular VARCHAR(20),
  email VARCHAR(150),
  nombre_padre VARCHAR(200),
  celular_padre VARCHAR(20),
  nombre_madre VARCHAR(200),
  celular_madre VARCHAR(20),
  rfc_tutor VARCHAR(13),
  grupo VARCHAR(20),
  grupo_id UUID REFERENCES grupos(id),
  curso VARCHAR(100),
  grado VARCHAR(50),
  instrumento VARCHAR(100),
  instrumento_id UUID REFERENCES instrumentos(id),
  fecha_ingreso DATE,
  fecha_baja DATE,
  motivo_baja VARCHAR(50),
  status VARCHAR(20) DEFAULT 'activo',
  beca BOOLEAN DEFAULT false,
  porcentaje_beca DECIMAL(5,2),
  medio_entero VARCHAR(50),
  medio_entero_id UUID REFERENCES medios_contacto(id),
  comentario TEXT,
  observaciones TEXT,
  reingreso BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLAS DE FACTORES (COMISIONES)
-- ============================================

-- Factores (Comisiones de Maestros)
CREATE TABLE IF NOT EXISTS factores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  maestro_id UUID REFERENCES maestros(id) ON DELETE CASCADE,
  curso_id UUID REFERENCES cursos(id) ON DELETE CASCADE,
  factor INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(maestro_id, curso_id)
);

-- ============================================
-- TABLAS DE INVENTARIO
-- ============================================

-- Grupos de Artículos
CREATE TABLE IF NOT EXISTS grupos_articulos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) UNIQUE NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Artículos
CREATE TABLE IF NOT EXISTS articulos (
  id BIGSERIAL PRIMARY KEY,
  clave VARCHAR(20) UNIQUE NOT NULL,
  descripcion VARCHAR(200) NOT NULL,
  grupo_articulo_id UUID REFERENCES grupos_articulos(id),
  precio DECIMAL(10,2) NOT NULL,
  existencia INTEGER DEFAULT 0,
  minimo INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Movimientos de Inventario (Maestro/Cabecera)
CREATE TABLE IF NOT EXISTS movimientos_inventario_maestro (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero SERIAL UNIQUE NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo_movimiento_id UUID REFERENCES tipos_movimiento(id),
  observaciones TEXT,
  usuario_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Movimientos de Inventario (Detalle)
CREATE TABLE IF NOT EXISTS movimientos_inventario_detalle (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  movimiento_id UUID REFERENCES movimientos_inventario_maestro(id) ON DELETE CASCADE,
  articulo_id BIGINT REFERENCES articulos(id),
  cantidad INTEGER NOT NULL,
  precio_unitario DECIMAL(10,2),
  total DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLAS DE PROSPECTOS
-- ============================================

-- Prospectos
CREATE TABLE IF NOT EXISTS prospectos (
  id SERIAL PRIMARY KEY,
  fecha_atencion DATE NOT NULL DEFAULT CURRENT_DATE,
  nombre VARCHAR(200) NOT NULL,
  apellidos VARCHAR(200),
  edad INTEGER,
  telefono VARCHAR(20),
  direccion VARCHAR(300),
  ciudad VARCHAR(100),
  codigo_postal VARCHAR(10),
  curso_id UUID REFERENCES cursos(id),
  medio_entero VARCHAR(50),
  recomienda VARCHAR(200),
  dia_preferente1 VARCHAR(20),
  hora_preferente1 VARCHAR(20),
  dia_preferente2 VARCHAR(20),
  hora_preferente2 VARCHAR(20),
  se_inscribio VARCHAR(10) DEFAULT 'No',
  sigue_interesado VARCHAR(10) DEFAULT 'Si',
  nota TEXT,
  atendio VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLAS DE BAJAS Y REINGRESOS
-- ============================================

-- Alumnos Bajas (para reingresos)
CREATE TABLE IF NOT EXISTS alumnos_bajas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credencial1 VARCHAR(10) NOT NULL,
  credencial2 VARCHAR(10),
  nombre VARCHAR(200) NOT NULL,
  direccion1 VARCHAR(300),
  direccion2 VARCHAR(300),
  telefono VARCHAR(20),
  celular VARCHAR(20),
  email VARCHAR(150),
  nombre_padre VARCHAR(200),
  celular_padre VARCHAR(20),
  nombre_madre VARCHAR(200),
  celular_madre VARCHAR(20),
  grupo VARCHAR(20),
  grado VARCHAR(50),
  fecha_ingreso DATE,
  fecha_baja DATE NOT NULL DEFAULT CURRENT_DATE,
  edad INTEGER,
  beca BOOLEAN DEFAULT false,
  porcentaje_beca DECIMAL(5,2),
  comentario TEXT,
  observaciones TEXT,
  instrumento_id UUID REFERENCES instrumentos(id),
  medio_entero_id UUID REFERENCES medios_contacto(id),
  motivo_baja_id UUID REFERENCES motivos_baja(id),
  reingresado BOOLEAN DEFAULT false,
  fecha_reingreso DATE,
  grupo_reingreso VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLAS TRANSACCIONALES (CAJA)
-- ============================================

-- Recibos (Cabecera)
CREATE TABLE IF NOT EXISTS recibos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero SERIAL UNIQUE NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  hora TIME NOT NULL DEFAULT CURRENT_TIME,
  precio_bruto DECIMAL(10,2),
  subtotal DECIMAL(10,2),
  descuento DECIMAL(10,2),
  iva DECIMAL(10,2),
  iva_porcentaje DECIMAL(5,2),
  total DECIMAL(10,2),
  efectivo DECIMAL(10,2),
  tarjeta DECIMAL(10,2),
  tarjeta_referencia TEXT,
  monto_recibido DECIMAL(10,2),
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

-- Operaciones (Detalle)
CREATE TABLE IF NOT EXISTS operaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recibo_id UUID REFERENCES recibos(id) ON DELETE CASCADE,
  operacion TEXT NOT NULL,
  tipo VARCHAR(50),
  credencial VARCHAR(10),
  alumno_id UUID REFERENCES alumnos(id),
  grupo VARCHAR(20),
  cantidad INTEGER DEFAULT 1,
  monto DECIMAL(10,2) NOT NULL,
  descuento DECIMAL(10,2) DEFAULT 0,
  iva DECIMAL(10,2) DEFAULT 0,
  neto DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Colegiaturas
CREATE TABLE IF NOT EXISTS colegiaturas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID REFERENCES alumnos(id),
  recibo_id UUID REFERENCES recibos(id),
  anio INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  descuento DECIMAL(10,2) DEFAULT 0,
  monto_pagado DECIMAL(10,2) NOT NULL,
  grupo VARCHAR(20),
  curso VARCHAR(100),
  fecha_pago DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(alumno_id, anio, mes)
);

-- Operaciones Canceladas
CREATE TABLE IF NOT EXISTS operaciones_canceladas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credencial VARCHAR(10),
  operacion TEXT,
  monto DECIMAL(10,2),
  recibo INTEGER,
  grupo VARCHAR(20),
  iva DECIMAL(10,2),
  cantidad INTEGER,
  descuento DECIMAL(10,2),
  general DECIMAL(10,2),
  neto DECIMAL(10,2),
  fecha_cancelacion TIMESTAMP NOT NULL DEFAULT NOW(),
  motivo_cancelacion TEXT,
  usuario_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLAS DE EXÁMENES
-- ============================================

-- Programación de Exámenes
CREATE TABLE IF NOT EXISTS programacion_examenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID REFERENCES alumnos(id),
  credencial VARCHAR(10),
  clave_examen VARCHAR(50),
  tipo_examen VARCHAR(50),
  fecha DATE NOT NULL,
  hora TIME,
  maestro_id UUID REFERENCES maestros(id),
  salon_id UUID REFERENCES salones(id),
  calificacion DECIMAL(5,2),
  aprobado BOOLEAN,
  certificado VARCHAR(50),
  pagado BOOLEAN DEFAULT false,
  monto DECIMAL(10,2),
  recibo_id UUID REFERENCES recibos(id),
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLAS DE SEGURIDAD
-- ============================================

-- Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  email VARCHAR(150),
  rol VARCHAR(50) DEFAULT 'usuario',
  manto_gral VARCHAR(1),
  acceso_alumnos BOOLEAN DEFAULT false,
  acceso_caja BOOLEAN DEFAULT false,
  acceso_reportes BOOLEAN DEFAULT false,
  acceso_examenes BOOLEAN DEFAULT false,
  acceso_mantenimiento BOOLEAN DEFAULT false,
  acceso_seguridad BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  ultimo_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Historial de Login
CREATE TABLE IF NOT EXISTS login_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(50) NOT NULL,
  login_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address VARCHAR(50),
  user_agent TEXT
);

-- RFC Clientes (Facturación)
CREATE TABLE IF NOT EXISTS rfc_clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfc VARCHAR(13) UNIQUE NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  direccion1 VARCHAR(300),
  direccion2 VARCHAR(300),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLAS DE AUDITORÍA
-- ============================================

-- Cambios de Alumnos
CREATE TABLE IF NOT EXISTS cambios_alumnos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID REFERENCES alumnos(id),
  credencial VARCHAR(10),
  tipo_cambio VARCHAR(50),
  grupo_anterior VARCHAR(20),
  grupo_nuevo VARCHAR(20),
  curso_anterior VARCHAR(100),
  curso_nuevo VARCHAR(100),
  motivo TEXT,
  fecha_cambio DATE NOT NULL DEFAULT CURRENT_DATE,
  usuario_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================

-- Alumnos
CREATE INDEX IF NOT EXISTS idx_alumnos_credencial ON alumnos(credencial1);
CREATE INDEX IF NOT EXISTS idx_alumnos_nombre ON alumnos(nombre);
CREATE INDEX IF NOT EXISTS idx_alumnos_status ON alumnos(status);
CREATE INDEX IF NOT EXISTS idx_alumnos_grupo ON alumnos(grupo);

-- Grupos
CREATE INDEX IF NOT EXISTS idx_grupos_curso ON grupos(curso_id);
CREATE INDEX IF NOT EXISTS idx_grupos_maestro ON grupos(maestro_id);
CREATE INDEX IF NOT EXISTS idx_grupos_dia ON grupos(dia);

-- Factores
CREATE INDEX IF NOT EXISTS idx_factores_maestro ON factores(maestro_id);
CREATE INDEX IF NOT EXISTS idx_factores_curso ON factores(curso_id);

-- Movimientos Inventario
CREATE INDEX IF NOT EXISTS idx_movimientos_maestro_fecha ON movimientos_inventario_maestro(fecha);
CREATE INDEX IF NOT EXISTS idx_movimientos_maestro_numero ON movimientos_inventario_maestro(numero);
CREATE INDEX IF NOT EXISTS idx_movimientos_detalle_movimiento ON movimientos_inventario_detalle(movimiento_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_detalle_articulo ON movimientos_inventario_detalle(articulo_id);

-- Prospectos
CREATE INDEX IF NOT EXISTS idx_prospectos_nombre ON prospectos(nombre);
CREATE INDEX IF NOT EXISTS idx_prospectos_fecha ON prospectos(fecha_atencion);

-- Alumnos Bajas
CREATE INDEX IF NOT EXISTS idx_alumnos_bajas_credencial ON alumnos_bajas(credencial1);
CREATE INDEX IF NOT EXISTS idx_alumnos_bajas_nombre ON alumnos_bajas(nombre);
CREATE INDEX IF NOT EXISTS idx_alumnos_bajas_fecha ON alumnos_bajas(fecha_baja);

-- Recibos
CREATE INDEX IF NOT EXISTS idx_recibos_fecha ON recibos(fecha);
CREATE INDEX IF NOT EXISTS idx_recibos_numero ON recibos(numero);

-- Operaciones
CREATE INDEX IF NOT EXISTS idx_operaciones_recibo ON operaciones(recibo_id);
CREATE INDEX IF NOT EXISTS idx_operaciones_alumno ON operaciones(alumno_id);
CREATE INDEX IF NOT EXISTS idx_operaciones_tipo ON operaciones(tipo);

-- Colegiaturas
CREATE INDEX IF NOT EXISTS idx_colegiaturas_alumno ON colegiaturas(alumno_id);
CREATE INDEX IF NOT EXISTS idx_colegiaturas_periodo ON colegiaturas(anio, mes);

-- Exámenes
CREATE INDEX IF NOT EXISTS idx_examenes_alumno ON programacion_examenes(alumno_id);
CREATE INDEX IF NOT EXISTS idx_examenes_fecha ON programacion_examenes(fecha);

-- ============================================
-- DATOS INICIALES (CATÁLOGOS)
-- ============================================

-- Motivos de Baja
INSERT INTO motivos_baja (clave, descripcion) VALUES
('CAC', 'CAMBIO DE CIUDAD'),
('ECO', 'PROBLEMAS ECONOMICOS'),
('SAL', 'PROBLEMAS DE SALUD'),
('TRA', 'PROBLEMAS DE TRABAJO'),
('TIE', 'FALTA DE TIEMPO'),
('INT', 'PERDIDA DE INTERES'),
('NOV', 'NOVEDAD'),
('OTR', 'OTROS')
ON CONFLICT (clave) DO NOTHING;

-- Instrumentos
INSERT INTO instrumentos (clave, descripcion) VALUES
('BAAY', 'BATERIA ACUSTICA YAMAHA'),
('GUEL', 'GUITARRA ELECTRICA'),
('GUAC', 'GUITARRA ACUSTICA'),
('PIAN', 'PIANO ACUSTICO'),
('PIEL', 'PIANO ELECTRICO'),
('VIOC', 'VIOLIN CLASICO'),
('SAXO', 'SAXOFON'),
('FLAU', 'FLAUTA'),
('BATE', 'BATERIA'),
('BAJO', 'BAJO ELECTRICO'),
('NOTI', 'NO TIENE')
ON CONFLICT (clave) DO NOTHING;

-- Medios de Contacto
INSERT INTO medios_contacto (clave, descripcion, tipo) VALUES
('REC', 'RECOMENDACION', 'Referencia'),
('FACE', 'FACEBOOK', 'Redes Sociales'),
('INT', 'INTERNET', 'Digital'),
('ANUN', 'ANUNCIO EXTERIOR', 'Publicidad'),
('VOLA', 'VOLANTE', 'Publicidad'),
('DY', 'DIARIO DE YUCATAN', 'Prensa'),
('RADI', 'RADIO', 'Medios'),
('T.V.', 'TELEVISION', 'Medios'),
('REI', 'REINSCRIPCION', 'Interno'),
('BLIV', 'BECA LIVERPOOL', 'Beca'),
('BSEA', 'BECA SEARS', 'Beca'),
('BPH', 'BECA PALACIO DE HIERRO', 'Beca')
ON CONFLICT (clave) DO NOTHING;

-- Tipos de Movimiento
INSERT INTO tipos_movimiento (clave, descripcion, afecta_inventario, tipo) VALUES
('AD', 'ADQUISICION', true, 'ENTRADA'),
('S', 'SALIDA', true, 'SALIDA'),
('E', 'ENTRADA', true, 'ENTRADA'),
('AJ', 'AJUSTE', true, 'AJUSTE')
ON CONFLICT (clave) DO NOTHING;

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_alumnos_updated_at ON alumnos;
CREATE TRIGGER update_alumnos_updated_at BEFORE UPDATE ON alumnos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_maestros_updated_at ON maestros;
CREATE TRIGGER update_maestros_updated_at BEFORE UPDATE ON maestros
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cursos_updated_at ON cursos;
CREATE TRIGGER update_cursos_updated_at BEFORE UPDATE ON cursos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_grupos_updated_at ON grupos;
CREATE TRIGGER update_grupos_updated_at BEFORE UPDATE ON grupos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_salones_updated_at ON salones;
CREATE TRIGGER update_salones_updated_at BEFORE UPDATE ON salones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_articulos_updated_at ON articulos;
CREATE TRIGGER update_articulos_updated_at BEFORE UPDATE ON articulos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar contador de alumnos en grupos
CREATE OR REPLACE FUNCTION actualizar_contador_alumnos()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE grupos 
        SET alumnos_inscritos = alumnos_inscritos + 1
        WHERE clave = NEW.grupo OR id = NEW.grupo_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.grupo != NEW.grupo OR OLD.grupo_id != NEW.grupo_id THEN
            UPDATE grupos 
            SET alumnos_inscritos = GREATEST(0, alumnos_inscritos - 1)
            WHERE clave = OLD.grupo OR id = OLD.grupo_id;
            
            UPDATE grupos 
            SET alumnos_inscritos = alumnos_inscritos + 1
            WHERE clave = NEW.grupo OR id = NEW.grupo_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE grupos 
        SET alumnos_inscritos = GREATEST(0, alumnos_inscritos - 1)
        WHERE clave = OLD.grupo OR id = OLD.grupo_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar contador de alumnos
DROP TRIGGER IF EXISTS trigger_actualizar_contador_alumnos ON alumnos;
CREATE TRIGGER trigger_actualizar_contador_alumnos
AFTER INSERT OR UPDATE OR DELETE ON alumnos
FOR EACH ROW EXECUTE FUNCTION actualizar_contador_alumnos();

-- Función para registrar cambios de alumnos
CREATE OR REPLACE FUNCTION registrar_cambio_alumno()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.grupo != NEW.grupo OR OLD.curso != NEW.curso THEN
        INSERT INTO cambios_alumnos (
            alumno_id, credencial, tipo_cambio,
            grupo_anterior, grupo_nuevo,
            curso_anterior, curso_nuevo,
            fecha_cambio
        ) VALUES (
            NEW.id, NEW.credencial1, 'Cambio de Grupo/Curso',
            OLD.grupo, NEW.grupo,
            OLD.curso, NEW.curso,
            CURRENT_DATE
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para registrar cambios
DROP TRIGGER IF EXISTS trigger_registrar_cambio_alumno ON alumnos;
CREATE TRIGGER trigger_registrar_cambio_alumno
AFTER UPDATE ON alumnos
FOR EACH ROW EXECUTE FUNCTION registrar_cambio_alumno();

-- Función para actualizar existencia de artículos al crear movimiento
CREATE OR REPLACE FUNCTION actualizar_existencia_articulo()
RETURNS TRIGGER AS $$
DECLARE
    tipo_mov VARCHAR(20);
    afecta_inv BOOLEAN;
BEGIN
    -- Obtener tipo de movimiento
    SELECT tm.tipo, tm.afecta_inventario INTO tipo_mov, afecta_inv
    FROM movimientos_inventario_maestro mm
    JOIN tipos_movimiento tm ON mm.tipo_movimiento_id = tm.id
    WHERE mm.id = NEW.movimiento_id;
    
    -- Solo actualizar si afecta inventario
    IF afecta_inv THEN
        IF tipo_mov = 'ENTRADA' OR tipo_mov = 'ADQUISICION' THEN
            -- Aumentar existencia
            UPDATE articulos 
            SET existencia = existencia + NEW.cantidad,
                updated_at = NOW()
            WHERE id = NEW.articulo_id;
        ELSIF tipo_mov = 'SALIDA' THEN
            -- Disminuir existencia
            UPDATE articulos 
            SET existencia = GREATEST(0, existencia - NEW.cantidad),
                updated_at = NOW()
            WHERE id = NEW.articulo_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar existencia
DROP TRIGGER IF EXISTS trigger_actualizar_existencia ON movimientos_inventario_detalle;
CREATE TRIGGER trigger_actualizar_existencia
AFTER INSERT ON movimientos_inventario_detalle
FOR EACH ROW EXECUTE FUNCTION actualizar_existencia_articulo();

-- Función para revertir existencia al eliminar movimiento
CREATE OR REPLACE FUNCTION revertir_existencia_articulo()
RETURNS TRIGGER AS $$
DECLARE
    tipo_mov VARCHAR(20);
    afecta_inv BOOLEAN;
BEGIN
    -- Obtener tipo de movimiento
    SELECT tm.tipo, tm.afecta_inventario INTO tipo_mov, afecta_inv
    FROM movimientos_inventario_maestro mm
    JOIN tipos_movimiento tm ON mm.tipo_movimiento_id = tm.id
    WHERE mm.id = OLD.movimiento_id;
    
    -- Solo revertir si afecta inventario
    IF afecta_inv THEN
        IF tipo_mov = 'ENTRADA' OR tipo_mov = 'ADQUISICION' THEN
            -- Revertir: disminuir existencia
            UPDATE articulos 
            SET existencia = GREATEST(0, existencia - OLD.cantidad),
                updated_at = NOW()
            WHERE id = OLD.articulo_id;
        ELSIF tipo_mov = 'SALIDA' THEN
            -- Revertir: aumentar existencia
            UPDATE articulos 
            SET existencia = existencia + OLD.cantidad,
                updated_at = NOW()
            WHERE id = OLD.articulo_id;
        END IF;
    END IF;
    
    RETURN OLD;
END;
$$ language 'plpgsql';

-- Trigger para revertir existencia al eliminar
DROP TRIGGER IF EXISTS trigger_revertir_existencia ON movimientos_inventario_detalle;
CREATE TRIGGER trigger_revertir_existencia
AFTER DELETE ON movimientos_inventario_detalle
FOR EACH ROW EXECUTE FUNCTION revertir_existencia_articulo();

-- Función para reingresar alumno desde bajas
CREATE OR REPLACE FUNCTION reingresar_alumno(
    p_baja_id UUID,
    p_grupo_nuevo VARCHAR(20),
    p_beca BOOLEAN DEFAULT false,
    p_porcentaje_beca DECIMAL(5,2) DEFAULT 0,
    p_observaciones TEXT DEFAULT ''
)
RETURNS UUID AS $$
DECLARE
    v_alumno_id UUID;
    v_baja RECORD;
BEGIN
    -- Obtener datos de la baja
    SELECT * INTO v_baja FROM alumnos_bajas WHERE id = p_baja_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Baja no encontrada';
    END IF;
    
    IF v_baja.reingresado THEN
        RAISE EXCEPTION 'Este alumno ya fue reingresado anteriormente';
    END IF;
    
    -- Crear nuevo registro de alumno
    INSERT INTO alumnos (
        credencial1, credencial2, nombre,
        direccion1, direccion2, telefono, celular, email,
        nombre_padre, celular_padre, nombre_madre, celular_madre,
        grupo, grado, fecha_ingreso,
        beca, porcentaje_beca, comentario,
        instrumento_id, medio_entero_id, status
    ) VALUES (
        v_baja.credencial1, v_baja.credencial2, v_baja.nombre,
        v_baja.direccion1, v_baja.direccion2, v_baja.telefono, v_baja.celular, v_baja.email,
        v_baja.nombre_padre, v_baja.celular_padre, v_baja.nombre_madre, v_baja.celular_madre,
        p_grupo_nuevo, v_baja.grado, CURRENT_DATE,
        p_beca, p_porcentaje_beca, p_observaciones,
        v_baja.instrumento_id, v_baja.medio_entero_id, 'activo'
    ) RETURNING id INTO v_alumno_id;
    
    -- Marcar baja como reingresada
    UPDATE alumnos_bajas 
    SET reingresado = true,
        fecha_reingreso = CURRENT_DATE,
        grupo_reingreso = p_grupo_nuevo
    WHERE id = p_baja_id;
    
    RETURN v_alumno_id;
END;
$$ language 'plpgsql';

-- ============================================
-- COMENTARIOS EN TABLAS
-- ============================================

COMMENT ON TABLE alumnos IS 'Registro de alumnos de la academia';
COMMENT ON TABLE maestros IS 'Catálogo de maestros';
COMMENT ON TABLE cursos IS 'Catálogo de cursos ofrecidos';
COMMENT ON TABLE grupos IS 'Grupos de clases con horarios';
COMMENT ON TABLE factores IS 'Factores/comisiones de maestros por curso';
COMMENT ON TABLE movimientos_inventario_maestro IS 'Cabecera de movimientos de inventario';
COMMENT ON TABLE movimientos_inventario_detalle IS 'Detalle de artículos en movimientos de inventario';
COMMENT ON TABLE prospectos IS 'Registro de prospectos (posibles alumnos)';
COMMENT ON TABLE alumnos_bajas IS 'Registro de alumnos dados de baja para reingresos';
COMMENT ON TABLE recibos IS 'Cabecera de recibos de pago';
COMMENT ON TABLE operaciones IS 'Detalle de operaciones por recibo';
COMMENT ON TABLE colegiaturas IS 'Registro de pagos mensuales';

-- ============================================
-- FIN DEL SCHEMA
-- ============================================
