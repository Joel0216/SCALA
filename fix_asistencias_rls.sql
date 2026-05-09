-- Política para permitir lectura de asistencias (programa de escritorio usa cliente anónimo)
CREATE POLICY "Allow public select on asistencias"
  ON asistencias
  FOR SELECT
  USING (true);

-- Política para permitir insertar/actualizar asistencias (app móvil autenticada)
CREATE POLICY "Allow authenticated insert on asistencias"
  ON asistencias
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on asistencias"
  ON asistencias
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
