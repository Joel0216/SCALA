-- Crear el bucket de comprobantes si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprobantes', 'comprobantes', true)
ON CONFLICT (id) DO NOTHING;

-- Habilitar acceso público al bucket
CREATE POLICY "Acceso Público Comprobantes"
ON storage.objects FOR SELECT
USING (bucket_id = 'comprobantes');

-- Permitir inserción a usuarios autenticados (o anónimos si RLS está deshabilitado)
CREATE POLICY "Inserción Comprobantes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'comprobantes');

-- Permitir actualización/borrado (opcional)
CREATE POLICY "Update Comprobantes"
ON storage.objects FOR UPDATE
USING (bucket_id = 'comprobantes');

CREATE POLICY "Delete Comprobantes"
ON storage.objects FOR DELETE
USING (bucket_id = 'comprobantes');
