# Documentación de Cambios: Módulos de Bajas y Factores

## 1. Módulo de Bajas y Reingresos (Alumnos)

### Archivos Modificados:
- `alumnos-bajas.html` / `.css` / `.js`
- `listado-bajas.html` / `.css` / `.js`
- `SCHEMA-BAJAS-REINGRESOS.sql`

### Funcionalidades Implementadas:
- **Gestión de Bajas:** Se implementó la lógica para dar de baja a un alumno, registrando fecha, motivo y observaciones.
- **Listado de Bajas:** Se creó una interfaz específica (`listado-bajas`) para visualizar a los alumnos inactivos.
- **Reingreso:** Funcionalidad para reactivar un alumno dado de baja, restaurando su estatus activo.
- **Interfaz Gráfica:** Se ajustaron los estilos y la disposición de los elementos para coincidir con el diseño general de la aplicación (colores, botones, tablas).

---

## 2. Módulo de Factores

### Archivos Nuevos/Modificados:
- `factores.html` / `.js` (Lógica principal)
- `factores-lista.html` / `.css` / `.js` (Nueva ventana de búsqueda)
- `SCHEMA-FACTORES.sql`

### Funcionalidades Implementadas:
- **CRUD de Factores:** 
  - **Crear/Editar:** Formulario para asociar un Factor y Porcentaje a un Maestro y Curso específico.
  - **Leer:** Visualización del factor actual con navegación entre registros.
  - **Borrar (Soft Delete):** Eliminación lógica (campo `activo = false`) con registro obligatorio de la razón del borrado.
- **Búsqueda Avanzada:**
  - Se implementó una **ventana emergente dedicada** (`factores-lista`) para buscar factores.
  - Filtro dinámico por nombre de maestro.
  - Al seleccionar un registro con doble clic, se carga automáticamente en la pantalla principal.
- **Mejoras de UX/UI:**
  - **Carga de Datos:** Corrección de la consulta (JOIN) para asegurar que los datos del maestro (Nombre, Grado, Ingreso) se muestren correctamente al navegar.
  - **Inicio Limpio:** El módulo ahora inicia con el formulario vacío ("Seleccione...") por defecto, en lugar de cargar el primer registro.
  - **Validaciones:** Se asegura que los IDs se comparen correctamente (texto vs número) para evitar errores de visualización.

---

### Notas Técnicas
- **Base de Datos:** Se optimizaron las consultas a Supabase para incluir relaciones (`maestros!inner`, `cursos`).
- **Conectividad:** Se robusteció la lógica de conexión en las ventanas emergentes para evitar errores de "No database connection", compartiendo la instancia `db` desde la ventana padre.
