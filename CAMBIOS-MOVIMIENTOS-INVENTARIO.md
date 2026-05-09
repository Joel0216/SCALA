# Resumen de Actualización: Módulo de Movimientos de Inventario

## Objetivo
Reescritura total, modernización y estabilización del módulo **Movimientos de Inventario** (`movimientos-inventario.html` / `.js`). Se migró la estructura de datos a un esquema de tabla única (flat) en Supabase, se implementaron validaciones estrictas de stock en tiempo real y se solventaron problemas críticos de concurrencia y despliegue en Electron (Focus Bug).

## Principales Cambios y Características Implementadas

### 1. Reestructuración de Base de Datos
- **Migración a Flat Table:** Se sustituyó el enfoque obsoleto de doble tabla (encabezado/detalle) por una única tabla (`movimientos_inventario`) donde cada fila representa un partida.
- **Trigger de Stock Automático:** El cálculo de existencias ya no depende de múltiples peticiones desde Javascript. Se diseñaron Triggers en PostgreSQL que ajustan el `stock` en la tabla `articulos` de manera automática al hacer `INSERT` o `DELETE` de movimientos.

### 2. Modernización de Interfaz (UI/UX)
- **Nuevo Buscador Estilo Ventana:** Se eliminó el pequeño modal de búsqueda. En su lugar, el botón **Buscar** abre una ventana dedicada y lista para ser maximizada (`movimientos-lista.html`), utilizando un paginador estilo DataGrid puro, idéntico al sistema de **Alumnos**.
- **Máquina de Estados de Botones:** El botón **Guardar** fue ocultado por defecto para evitar guardados fantasma. Solo aparece al iniciar un **Nuevo Movimiento** y convive únicamente con el botón **Cancelar**.
- **Restricción de Búsqueda de Artículos:** El campo `Clave` del artículo queda inhabilitado (Solo lectura estricta y bloqueo de clic/Enter) a menos que se haya iniciado activamente un movimiento.

### 3. Validaciones de Negocio Extensivas
- **Inyección de IVA Corregida:** Se arregló el comportamiento por el cual la columna `iva` guardada en decimal (ej. `0.16`) no se representaba. Ahora lee e inyecta la fracción decimal y la traslada correctamente como formato `16%` en la tabla temporal.
- **Validación Estricta de Stock "En Vivo":** Cuando se selecciona un Tipo de Movimiento con efecto **RESTA** (Ej. Ventas, Bajas), el sistema monitorea cada carácter que se teclea en "Cantidad". Si la cantidad excede la existencia real de la base de datos (considerando lo que ya se agregó a la tabla temporal), bloquea el teclado y detiene la agregación.

### 4. Estructura de "Tipos de Movimiento"
- **Rediseño del Modal de Tablas:** El Modal "Gestión de Tipos" dejó de ser una sola lista desordenada. Se fraccionó la vista principal en **3 tablas independientes y semánticas**:
  - Entradas (Suma)
  - Salidas (Resta)
  - Ajustes (Ninguno)

### 5. Resolución de Bug Crítico de Electron (Focus Trap)
- **Migración a IPC Dialgos Seguros:** El uso de cuadros nativos estilo `confirm(...)` generaban pérdidas de foco silencioso de teclado dentro del empaquetado final de Electron. Todos los `confirm` (Al cancelar movimientos, al eliminar artículos de la fila temporal, al intentar cerrar la pestaña) fueron eliminados y reemplazados con el componente asíncrono customizado web `mostrarConfirm()` de `utils-inputs.js`.

## Archivos Afectados
- `movimientos-inventario.html`, `movimientos-inventario.js`, `movimientos-inventario.css`
- `movimientos-inventario-new.html`, `movimientos-inventario-new.js`, `movimientos-inventario-new.css` *(Entornos de staging unificados contra el master)*
- `movimientos-lista.html`, `movimientos-lista.js` (NUEVOS - Ventana completa de búsqueda)
- `utils-inputs.js` (Inyección requerida para modales)
- `SCHEMA-MOVIMIENTOS-FLAT.sql`, `SCHEMA-ARTICULOS.sql`
