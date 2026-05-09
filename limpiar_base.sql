-- Script para limpiar completamente grupos, asistencias, alumnos asignados y clases

-- 1. Borrar todas las asistencias registradas
TRUNCATE TABLE asistencias RESTART IDENTITY CASCADE;

-- 2. Borrar las sesiones de clase
TRUNCATE TABLE sesiones_clase RESTART IDENTITY CASCADE;

-- 3. Quitar a los alumnos inscritos de los grupos
TRUNCATE TABLE alumno_grupos RESTART IDENTITY CASCADE;

-- 4. Eliminar todos los grupos de la tabla principal
TRUNCATE TABLE grupos RESTART IDENTITY CASCADE;

-- (Los maestros, alumnos libres, cursos y salones se mantienen intactos para que puedas crear grupos nuevos sin tener que registrar personal nuevamente)
