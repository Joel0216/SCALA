# Instrucciones para Configurar Supabase

## Paso 1: Crear las Tablas

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard/project/vqsduyfkgdqnigzkxazk
2. En el menú lateral, haz clic en **SQL Editor**
3. Copia TODO el contenido del archivo `SCALA_FULL_SCHEMA.sql`
4. Pégalo en el editor SQL y haz clic en **Run**
5. Espera a que termine (puede tardar unos segundos)

## Paso 2: Deshabilitar RLS (Row Level Security)

Esto es MUY IMPORTANTE para que la aplicación pueda leer/escribir datos:

1. Ve a **Table Editor** en el menú lateral
2. Para CADA tabla, haz clic en ella y luego:
   - Haz clic en el ícono de configuración (engranaje) o en "RLS Policies"
   - Desactiva "Enable RLS" o "Row Level Security"
   - O ejecuta este SQL:

```sql
-- Deshabilitar RLS en todas las tablas
ALTER TABLE motivos_baja DISABLE ROW LEVEL SECURITY;
ALTER TABLE instrumentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE medios_contacto DISABLE ROW LEVEL SECURITY;
ALTER TABLE salones DISABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_movimiento DISABLE ROW LEVEL SECURITY;
ALTER TABLE cursos DISABLE ROW LEVEL SECURITY;
ALTER TABLE maestros DISABLE ROW LEVEL SECURITY;
ALTER TABLE grupos DISABLE ROW LEVEL SECURITY;
ALTER TABLE alumnos DISABLE ROW LEVEL SECURITY;
ALTER TABLE alumnos_bajas DISABLE ROW LEVEL SECURITY;
ALTER TABLE grupos_articulos DISABLE ROW LEVEL SECURITY;
ALTER TABLE articulos DISABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario_maestro DISABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario_detalle DISABLE ROW LEVEL SECURITY;
ALTER TABLE recibos DISABLE ROW LEVEL SECURITY;
ALTER TABLE operaciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE rfc_clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE programacion_examenes DISABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE factores DISABLE ROW LEVEL SECURITY;
ALTER TABLE prospectos DISABLE ROW LEVEL SECURITY;
```

## Paso 3: Cargar Datos Iniciales

1. En el **SQL Editor**, copia TODO el contenido de `-DATOSINICIALES-SUPABASE.sql`
2. Pégalo y haz clic en **Run**
3. Esto cargará:
   - Catálogos (motivos, instrumentos, medios, salones)
   - 65+ cursos
   - 30 maestros
   - 10 grupos de ejemplo
   - 12 alumnos de ejemplo
   - Artículos de inventario
   - Y más...

## Paso 4: Verificar la Conexión

1. Abre el archivo `test-supabase-connection.html` en tu navegador
2. Haz clic en "Probar Conexión"
3. Si todo está bien, verás "✅ Conexión exitosa!"
4. Prueba cargar Cursos, Maestros, Alumnos para verificar los datos

## Solución de Problemas

### Error "relation does not exist"
- Las tablas no se crearon. Ejecuta `SCALA_FULL_SCHEMA.sql` primero.

### Error "permission denied" o "RLS"
- RLS está habilitado. Ejecuta el SQL del Paso 2 para deshabilitarlo.

### Error "Supabase no está inicializado"
- Verifica que el archivo HTML tenga estos scripts en orden:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="supabase-config.js"></script>
```

### Los inputs se bloquean después de alerts
- Presiona la tecla **Escape** para desbloquearlos
- O haz clic en cualquier parte de la ventana

## Credenciales de Supabase

- **URL**: https://vqsduyfkgdqnigzkxazk.supabase.co
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxc2R1eWZrZ2Rxbmlnemt4YXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMzIyOTMsImV4cCI6MjA4NDYwODI5M30.l5bZubjb3PIvcFG43JTfoeguldEwwIK7wlnOnl-Ec5o
