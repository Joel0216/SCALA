-- ==========================================
-- 1. TABLA DE INSTRUMENTOS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.instrumentos (
    clave VARCHAR(50) PRIMARY KEY,
    descripcion VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==========================================
-- 2. TABLA DE SALONES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.salones (
    numero INTEGER PRIMARY KEY,
    ubicacion VARCHAR(255),
    cupo INTEGER NOT NULL DEFAULT 0,
    instrumentos_texto TEXT, -- Respaldo del texto original migrado
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==========================================
-- 3. TABLA RELACIONAL SALON <-> INSTRUMENTOS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.salon_instrumentos (
    id SERIAL PRIMARY KEY,
    salon_numero INTEGER REFERENCES public.salones(numero) ON DELETE CASCADE,
    instrumento_clave VARCHAR(50) REFERENCES public.instrumentos(clave) ON DELETE CASCADE,
    cantidad INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Limpiar si ya existen datos para recargar
TRUNCATE TABLE public.salon_instrumentos CASCADE;
TRUNCATE TABLE public.salones CASCADE;
TRUNCATE TABLE public.instrumentos CASCADE;


-- Insertar Instrumentos
INSERT INTO public.instrumentos (clave, descripcion) VALUES ('BAAY', 'BATER. ACUST. YAMAHA');
INSERT INTO public.instrumentos (clave, descripcion) VALUES ('BAEY', 'BATER. ELECT. YAMAHA');
INSERT INTO public.instrumentos (clave, descripcion) VALUES ('BAOM', 'BATERIA OTRA MARCA');
INSERT INTO public.instrumentos (clave, descripcion) VALUES ('BELY', 'BAJO ELECT. YAMAHA');
INSERT INTO public.instrumentos (clave, descripcion) VALUES ('BEOM', 'BAJO ELECT. OTRA MAR');
INSERT INTO public.instrumentos (clave, descripcion) VALUES ('CLAY', 'CLAVINOVA YAMAHA');
INSERT INTO public.instrumentos (clave, descripcion) VALUES ('CLOM', 'CLAVINOVA OTRA MARCA');
INSERT INTO public.instrumentos (clave, descripcion) VALUES ('ELBK', 'ELECT- LINEA BK');
INSERT INTO public.instrumentos (clave, descripcion) VALUES ('EOM', 'ELECT. OTRA MARCA');
INSERT INTO public.instrumentos (clave, descripcion) VALUES ('EYB', 'ELECT. LINEA B');
INSERT INTO public.instrumentos (clave, descripcion) VALUES ('EYEL', 'ELECT. LINEA EL');
INSERT INTO public.instrumentos (clave, descripcion) VALUES ('EYFC', 'ELECT. YAMAHA FC');
INSERT INTO public.instrumentos (clave, descripcion) VALUES ('EYHE', 'ELECTONE LINEA HE');
INSERT INTO public.instrumentos (clave, descripcion) VALUES ('EYHS', 'ELECT. LINEA HS');
INSERT INTO public.instrumentos (clave, descripcion) VALUES ('EYME', 'ELECT. LINEA ME');
INSERT INTO public.instrumentos (clave, descripcion) VALUES ('EYOM', 'ELCT YAMAHA OTRO MOD');
INSERT INTO public.instrumentos (clave, descripcion) VALUES ('GELY', 'GUIT.ELECT. YAMAHA');
INSERT INTO public.instrumentos (clave, descripcion) VALUES ('GEOM', 'GUIT.ELECT.OTRA MARC');
INSERT INTO public.instrumentos (clave, descripcion) VALUES ('GUIY', 'GUIT.ACUST.YAMAHA');
INSERT INTO public.instrumentos (clave, descripcion) VALUES ('GUOM', 'GUIT. ACUS. OTRA MAR');
INSERT INTO public.instrumentos (clave, descripcion) VALUES ('NOTI', 'NO TIENE INSTRUMENTO');
INSERT INTO public.instrumentos (clave, descripcion) VALUES ('PIAY', 'PIANO YAMAHA');
INSERT INTO public.instrumentos (clave, descripcion) VALUES ('PIOM', 'PIANO OTRO MARCA');
INSERT INTO public.instrumentos (clave, descripcion) VALUES ('SAOM', 'SAXOFON OTRA MARCA');
INSERT INTO public.instrumentos (clave, descripcion) VALUES ('SAXY', 'SAXOFON YAMAHA');
INSERT INTO public.instrumentos (clave, descripcion) VALUES ('SINY', 'SINTET. YAMAHA');
INSERT INTO public.instrumentos (clave, descripcion) VALUES ('SIOM', 'SINTET. OTRA MARCA');
INSERT INTO public.instrumentos (clave, descripcion) VALUES ('TOM', 'TECLADO OTRA MARCA');
INSERT INTO public.instrumentos (clave, descripcion) VALUES ('TPSR', 'TECLADO PSR');
INSERT INTO public.instrumentos (clave, descripcion) VALUES ('TPSS', 'TECLADO PSS');
INSERT INTO public.instrumentos (clave, descripcion) VALUES ('TYOM', 'TEC. YAMAHA OTRO MOD');

-- Insertar Salones
INSERT INTO public.salones (numero, ubicacion, cupo, instrumentos_texto) VALUES (0, 'Sin Salon', 0, 'nada');
INSERT INTO public.salones (numero, ubicacion, cupo, instrumentos_texto) VALUES (1, 'Estrellita', 10, '10 EL7, EL57, LU90');
INSERT INTO public.salones (numero, ubicacion, cupo, instrumentos_texto) VALUES (2, 'Teclado Pop', 8, '7 psr220 y 1 psr230 PSR640');
INSERT INTO public.salones (numero, ubicacion, cupo, instrumentos_texto) VALUES (3, 'Guitarra Fundamental', 10, '11 C-70');
INSERT INTO public.salones (numero, ubicacion, cupo, instrumentos_texto) VALUES (4, 'Guitarra Eléctrica y Bajo Eléctrico', 8, '8 Pacificas');
INSERT INTO public.salones (numero, ubicacion, cupo, instrumentos_texto) VALUES (5, 'Bateria', 5, '4 Practicadores y 1 Yamaha stage');
INSERT INTO public.salones (numero, ubicacion, cupo, instrumentos_texto) VALUES (6, 'Piano Pop y Clavinova Club', 4, '4 CLP-920, CVP-94');
