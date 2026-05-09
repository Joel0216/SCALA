-- Script para limpiar LA BASE DE DATOS (Entorno de Producción para Cliente)
-- ESTE SCRIPT ELIMINA TODAS LAS TRANSACCIONES Y REGISTROS DE PRUEBA
-- PERO MANTIENE: Cursos, Maestros, Artículos, Factores, Medios de contacto y Salones (Catálogos).

-- 1. Asistencias y Clases
TRUNCATE TABLE asistencias RESTART IDENTITY CASCADE;
TRUNCATE TABLE sesiones_clase RESTART IDENTITY CASCADE;

-- 2. Alumnos y Grupos
TRUNCATE TABLE alumno_grupos RESTART IDENTITY CASCADE;
TRUNCATE TABLE grupos RESTART IDENTITY CASCADE;
TRUNCATE TABLE alumnos RESTART IDENTITY CASCADE;

-- 3. Caja y Finanzas
TRUNCATE TABLE recibos_detalle RESTART IDENTITY CASCADE;
TRUNCATE TABLE recibos RESTART IDENTITY CASCADE;
TRUNCATE TABLE operaciones RESTART IDENTITY CASCADE;
TRUNCATE TABLE recibos_cancelados RESTART IDENTITY CASCADE;
TRUNCATE TABLE cortes RESTART IDENTITY CASCADE;

-- 4. Inventarios
TRUNCATE TABLE movimientos_inventario RESTART IDENTITY CASCADE;

-- 5. Exámenes (Si existen estas tablas)
-- TRUNCATE TABLE examenes RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE notas_examen RESTART IDENTITY CASCADE;

-- =========================================================================
-- Si deseas borrar TAMBIÉN LOS CATÁLOGOS (Maestros, Artículos, etc) 
-- y dejar la base completamente en blanco (desde cero absoluto), 
-- ejecuta estas líneas adicionales:
-- =========================================================================
-- TRUNCATE TABLE cursos RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE maestros RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE articulos RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE salones RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE medios_contacto RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE factores RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE motivos RESTART IDENTITY CASCADE;
