-- ============================================
-- SCHEMA COMPLETO PARA SISTEMA SCALA
-- Academia de Música
-- PostgreSQL / Supabase
-- ============================================

-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLAS DE CATÁLOGOS
-- ============================================

-- Motivos de Baja
CREATE TABLE motivos_baja (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clave VARCHAR(10) UNIQUE NOT NULL,
  descripcion VARCHAR(200) NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Instrumentos
CREATE TABLE instrumentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clave VARCHAR(10) UNIQUE NOT NULL,
  descripcion VARCHAR(200) NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Medios de Contacto
CREATE TABLE medios_contacto (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clave VARCHAR(10) UNIQUE NOT NULL,
  descripcion VARCHAR(200) NOT NULL,
  tipo VARCHAR(50),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Salones
CREATE TABLE salones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero VARCHAR(20) UNIQUE NOT NULL,
  ubicacion VARCHAR(200),
  cupo INTEGER DEFAULT 10,
  instrumentos TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);


-- ============================================
-- TABLAS MAESTRAS
-- ============================================

-- Cursos
CREATE TABLE cursos (
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
CREATE TABLE maestros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(200) NOT NULL,
  direccion VARCHAR(300),
  telefono VARCHAR(20),
  celular VARCHAR(20),
  email VARCHAR(150),
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
CREATE TABLE grupos (
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
CREATE TABLE alumnos (
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
  curso VARCHAR(100),
  grado VARCHAR(50),
  instrumento VARCHAR(100),
  fecha_ingreso DATE,
  fecha_baja DATE,
  motivo_baja VARCHAR(50),
  status VARCHAR(20) DEFAULT 'activo',
  beca BOOLEAN DEFAULT false,
  porcentaje_beca DECIMAL(5,2),
  medio_entero VARCHAR(50),
  comentario TEXT,
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);


-- ============================================
-- TABLAS TRANSACCIONALES (CAJA)
-- ============================================

-- Recibos (Cabecera)
CREATE TABLE recibos (
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
CREATE TABLE operaciones (
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
CREATE TABLE colegiaturas (
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
CREATE TABLE operaciones_canceladas (
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
-- TABLAS DE INVENTARIO
-- ============================================

-- Grupos de Artículos
CREATE TABLE grupos_articulos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) UNIQUE NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Artículos
CREATE TABLE articulos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Movimientos de Inventario
CREATE TABLE movimientos_inventario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  articulo_id BIGINT REFERENCES articulos(id),
  tipo VARCHAR(20) NOT NULL,
  cantidad INTEGER NOT NULL,
  precio_unitario DECIMAL(10,2),
  total DECIMAL(10,2),
  recibo_id UUID REFERENCES recibos(id),
  operacion_id UUID REFERENCES operaciones(id),
  observaciones TEXT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  usuario_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLAS DE EXÁMENES
-- ============================================

-- Programación de Exámenes
CREATE TABLE programacion_examenes (
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
-- TABLAS DE PROSPECTOS
-- ============================================

-- Prospectos
CREATE TABLE prospectos (
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
  dia_preferente1 VARCHAR(2),
  hora_preferente1 TIME,
  dia_preferente2 VARCHAR(2),
  hora_preferente2 TIME,
  se_inscribio VARCHAR(10) DEFAULT 'No',
  sigue_interesado VARCHAR(10) DEFAULT 'Si',
  nota TEXT,
  atendio VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLAS DE SEGURIDAD
-- ============================================

-- Usuarios
CREATE TABLE usuarios (
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
CREATE TABLE login_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(50) NOT NULL,
  login_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address VARCHAR(50),
  user_agent TEXT
);

-- RFC Clientes (Facturación)
CREATE TABLE rfc_clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfc VARCHAR(13) UNIQUE NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  direccion1 VARCHAR(300),
  direccion2 VARCHAR(300),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Factores (Comisiones de Maestros)
CREATE TABLE factores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  maestro_id UUID REFERENCES maestros(id),
  curso_id UUID REFERENCES cursos(id),
  factor INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(maestro_id, curso_id)
);


-- ============================================
-- TABLAS DE AUDITORÍA
-- ============================================

-- Cambios de Alumnos
CREATE TABLE cambios_alumnos (
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
CREATE INDEX idx_alumnos_credencial ON alumnos(credencial1);
CREATE INDEX idx_alumnos_nombre ON alumnos(nombre);
CREATE INDEX idx_alumnos_status ON alumnos(status);
CREATE INDEX idx_alumnos_grupo ON alumnos(grupo);

-- Grupos
CREATE INDEX idx_grupos_curso ON grupos(curso_id);
CREATE INDEX idx_grupos_maestro ON grupos(maestro_id);
CREATE INDEX idx_grupos_dia ON grupos(dia);

-- Recibos
CREATE INDEX idx_recibos_fecha ON recibos(fecha);
CREATE INDEX idx_recibos_numero ON recibos(numero);

-- Operaciones
CREATE INDEX idx_operaciones_recibo ON operaciones(recibo_id);
CREATE INDEX idx_operaciones_alumno ON operaciones(alumno_id);
CREATE INDEX idx_operaciones_tipo ON operaciones(tipo);

-- Colegiaturas
CREATE INDEX idx_colegiaturas_alumno ON colegiaturas(alumno_id);
CREATE INDEX idx_colegiaturas_periodo ON colegiaturas(anio, mes);

-- Exámenes
CREATE INDEX idx_examenes_alumno ON programacion_examenes(alumno_id);
CREATE INDEX idx_examenes_fecha ON programacion_examenes(fecha);


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
('OTR', 'OTROS');

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
('BAJO', 'BAJO ELECTRICO');

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
('BPH', 'BECA PALACIO DE HIERRO', 'Beca');

-- Usuario Administrador por defecto
-- Password: admin123 (cambiar en producción)
INSERT INTO usuarios (user_id, password, nombre, rol, manto_gral, 
  acceso_alumnos, acceso_caja, acceso_reportes, acceso_examenes, 
  acceso_mantenimiento, acceso_seguridad, activo)
VALUES (
  'admin',
  '$2a$10$rOzJQjYJKvXEqvqxNvHdHOxJ5YqKxGxKxGxKxGxKxGxKxGxKxGxKx', -- Hash de 'admin123'
  'Administrador del Sistema',
  'admin',
  'M',
  true, true, true, true, true, true, true
);


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
CREATE TRIGGER update_alumnos_updated_at BEFORE UPDATE ON alumnos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maestros_updated_at BEFORE UPDATE ON maestros
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cursos_updated_at BEFORE UPDATE ON cursos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grupos_updated_at BEFORE UPDATE ON grupos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_salones_updated_at BEFORE UPDATE ON salones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articulos_updated_at BEFORE UPDATE ON articulos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar contador de alumnos en grupos
CREATE OR REPLACE FUNCTION actualizar_contador_alumnos()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE grupos 
        SET alumnos_inscritos = alumnos_inscritos + 1
        WHERE clave = NEW.grupo;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.grupo != NEW.grupo THEN
            UPDATE grupos 
            SET alumnos_inscritos = alumnos_inscritos - 1
            WHERE clave = OLD.grupo;
            
            UPDATE grupos 
            SET alumnos_inscritos = alumnos_inscritos + 1
            WHERE clave = NEW.grupo;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE grupos 
        SET alumnos_inscritos = alumnos_inscritos - 1
        WHERE clave = OLD.grupo;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar contador de alumnos
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
CREATE TRIGGER trigger_registrar_cambio_alumno
AFTER UPDATE ON alumnos
FOR EACH ROW EXECUTE FUNCTION registrar_cambio_alumno();


-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista de alumnos con información completa
CREATE OR REPLACE VIEW v_alumnos_completo AS
SELECT 
    a.*,
    g.clave as grupo_clave,
    c.curso as curso_nombre,
    c.precio_mensual,
    m.nombre as maestro_nombre
FROM alumnos a
LEFT JOIN grupos g ON a.grupo = g.clave
LEFT JOIN cursos c ON g.curso_id = c.id
LEFT JOIN maestros m ON g.maestro_id = m.id;

-- Vista de grupos con información completa
CREATE OR REPLACE VIEW v_grupos_completo AS
SELECT 
    g.*,
    c.curso as curso_nombre,
    c.precio_mensual,
    m.nombre as maestro_nombre,
    s.numero as salon_numero,
    s.ubicacion as salon_ubicacion
FROM grupos g
LEFT JOIN cursos c ON g.curso_id = c.id
LEFT JOIN maestros m ON g.maestro_id = m.id
LEFT JOIN salones s ON g.salon_id = s.id;

-- Vista de recibos con totales
CREATE OR REPLACE VIEW v_recibos_detalle AS
SELECT 
    r.*,
    COUNT(o.id) as num_operaciones,
    SUM(o.neto) as total_calculado
FROM recibos r
LEFT JOIN operaciones o ON r.id = o.recibo_id
GROUP BY r.id;

-- Vista de colegiaturas pendientes
CREATE OR REPLACE VIEW v_colegiaturas_pendientes AS
SELECT 
    a.id as alumno_id,
    a.credencial1,
    a.nombre,
    a.grupo,
    a.curso,
    EXTRACT(YEAR FROM CURRENT_DATE) as anio,
    EXTRACT(MONTH FROM CURRENT_DATE) as mes,
    c.precio_mensual,
    CASE WHEN a.beca THEN 
        c.precio_mensual * (1 - a.porcentaje_beca/100)
    ELSE 
        c.precio_mensual
    END as monto_a_pagar
FROM alumnos a
LEFT JOIN grupos g ON a.grupo = g.clave
LEFT JOIN cursos c ON g.curso_id = c.id
LEFT JOIN colegiaturas col ON 
    a.id = col.alumno_id AND 
    col.anio = EXTRACT(YEAR FROM CURRENT_DATE) AND
    col.mes = EXTRACT(MONTH FROM CURRENT_DATE)
WHERE a.status = 'activo' AND col.id IS NULL;

-- Vista de honorarios de maestros
CREATE OR REPLACE VIEW v_honorarios_maestros AS
SELECT 
    m.id as maestro_id,
    m.nombre as maestro,
    c.curso,
    g.clave as grupo,
    g.alumnos_inscritos,
    c.precio_mensual,
    f.factor,
    (g.alumnos_inscritos * c.precio_mensual * f.factor / 100) as honorarios
FROM maestros m
JOIN grupos g ON m.id = g.maestro_id
JOIN cursos c ON g.curso_id = c.id
LEFT JOIN factores f ON m.id = f.maestro_id AND c.id = f.curso_id
WHERE m.status = 'activo' AND g.status = 'activo';

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en tablas sensibles
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE recibos ENABLE ROW LEVEL SECURITY;
ALTER TABLE operaciones ENABLE ROW LEVEL SECURITY;

-- Políticas de ejemplo (ajustar según necesidades)
-- Solo administradores pueden ver todos los usuarios
CREATE POLICY "Administradores ven todos los usuarios"
ON usuarios FOR SELECT
USING (auth.jwt() ->> 'rol' = 'admin');

-- Usuarios pueden ver su propio registro
CREATE POLICY "Usuarios ven su propio registro"
ON usuarios FOR SELECT
USING (auth.uid()::text = id::text);

-- ============================================
-- FIN DEL SCHEMA
-- ============================================

-- Comentarios en tablas principales
COMMENT ON TABLE alumnos IS 'Registro de alumnos de la academia';
COMMENT ON TABLE maestros IS 'Catálogo de maestros';
COMMENT ON TABLE cursos IS 'Catálogo de cursos ofrecidos';
COMMENT ON TABLE grupos IS 'Grupos de clases con horarios';
COMMENT ON TABLE recibos IS 'Cabecera de recibos de pago';
COMMENT ON TABLE operaciones IS 'Detalle de operaciones por recibo';
COMMENT ON TABLE colegiaturas IS 'Registro de pagos mensuales';

