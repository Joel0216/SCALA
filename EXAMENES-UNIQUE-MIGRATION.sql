-- Agregar restricción UNIQUE a (clave_examen, alumno_id) para que UPSERT funcione correctamente en móvil
ALTER TABLE resultados_examen ADD CONSTRAINT idx_resultados_examen_unique UNIQUE (clave_examen, alumno_id);
