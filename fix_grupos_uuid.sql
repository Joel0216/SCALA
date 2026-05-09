-- 1. Eliminar la restricción actual que requiere UUID
ALTER TABLE grupos DROP CONSTRAINT IF EXISTS grupos_salon_id_fkey;

-- 2. Cambiar el tipo de columna a VARCHAR para aceptar números de salón (1, 2, A, etc.)
-- Primero quitamos el valor por defecto si existe y cambiamos tipo
ALTER TABLE grupos ALTER COLUMN salon_id TYPE VARCHAR(10);

-- 3. Crear la nueva relación apuntando a la columna 'numero' de salones
-- Aseguramos que salones.numero tenga un índice único (ya lo tiene por el UNIQUE)
ALTER TABLE grupos 
ADD CONSTRAINT grupos_salon_numero_fkey 
FOREIGN KEY (salon_id) REFERENCES salones(numero) ON DELETE SET NULL;

-- 4. Notificar a PostgREST para refrescar caché
NOTIFY pgrst, 'reload schema';
