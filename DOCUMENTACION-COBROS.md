# Documentación Técnica: Módulo de Cobros (Versión 1.5)

Esta documentación detalla las funcionalidades principales y la arquitectura del Módulo de Cobros del Sistema Scala, incluyendo las mejoras recientes en facturación, impresión y gestión de historial.

## 1. Tecnologías Utilizadas
- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+).
- **Backend/DB**: Supabase (PostgreSQL).
- **Runtime**: Electron.

## 2. Flujo de Trabajo Principal

### Asignación de Folio
El sistema utiliza la función `assignNextReceipt()` para consultar en la tabla `recibos` el último número asignado. Al activarse, el botón de asignación cambia a un estado visual "activo" (verde con brillo) para dar feedback al usuario de que el módulo está listo para operar.

### Selección de Alumnos y Operaciones
- Las funcionalidades de búsqueda (lookups) están conectadas directamente a la base de datos de Supabase.
- Los datos del alumno incluyen una carga automática de RFC desde la tabla `rfc_credenciales` y `rfc_clientes`.
- Las operaciones se agregan dinámicamente a una tabla de conceptos antes de ser guardadas.

### Facturación y Recibos
- **Guardado**: Al hacer clic en "Guardar e imprimir", el sistema valida el método de pago (Efectivo/Tarjeta) y envía la información a `recibos` y `operaciones`.
- **Impresión Directa**: El sistema genera el HTML del documento (Recibo o Factura UTM) y lo inyecta en un área oculta (`#receipt-print-area`). Luego, dispara `window.print()` automáticamente, permitiendo la descarga en PDF o impresión física sin previsualizaciones que rompan la interfaz.

## 3. Gestión de Historial (Paginación y Eliminación)

### Búsqueda de Transacciones
Se ha implementado un modal de búsqueda avanzada accesible mediante el icono de lupa 🔍.
- **Paginación Estilo Supabase**: Los registros se recuperan en bloques de 100 elementos (`searchRowsPerPage = 100`) para optimizar el rendimiento.
- **Controles de Navegación**: Se incluyen botones para desplazamiento rápido: Inicio, Anterior, Siguiente y Final.

### Eliminación (Borrado Especial)
Cada registro en la búsqueda incluye un icono de papelera 🗑️.
- **Borrado en Cascada**: Al confirmar la eliminación, el sistema borra tanto el registro del recibo como todos los conceptos (`operaciones`) relacionados en una sola secuencia, garantizando la integridad de los datos.

## 4. Archivos Clave
- `cobros.html`: Estructura del módulo y modales.
- `cobros.js`: Lógica de negocio, integración con Supabase e impresión.
- `cobros.css`: Estilos visuales premium y configuración de media queries para impresión.

## 5. Mantenimiento y Notas
- No se deben eliminar las variables globales de estado de paginación (`lookup...` y `search...`), ya que son esenciales para el funcionamiento de las tablas dinámicas.
- Las plantillas de impresión (Factura UTM) se gestionan mediante funciones que devuelven strings de HTML (`generateInvoiceHTML` y `generatePrintReceipt`).
