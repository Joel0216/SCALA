# SCALA - Documentación de Estabilización (24/04/2026)

Este documento resume las correcciones críticas realizadas para estabilizar el ciclo de vida de pagos, la gestión de alumnos y la promoción de grupos en el sistema SCALA.

## 1. Módulo de Caja / Cobros

### Problemas Resueltos:
- **Error de Base de Datos (PGRST204)**: El sistema intentaba insertar detalles de cobro en la tabla `operaciones` (catálogo) en lugar de `recibos_detalle` (transacciones). Se corrigió el mapeo de tablas en `cobros.js`.
- **Botón "Guardar e Imprimir"**: El botón se encontraba deshabilitado o invisible en ciertos flujos (especialmente al ser redirigido desde la pantalla de alumnos). Se actualizó la lógica de validación para asegurar su activación inmediata cuando el "carrito" contiene elementos.

## 2. Módulo de Alumnos

### Estabilidad y Crasheos:
- **Error `toFixed`**: Se implementaron protecciones del tipo `(valor || 0).toFixed(2)` en todas las tablas de historial y totales para evitar que el sistema falle cuando los montos llegan como `undefined`.
- **Reporte de Errores en Altas**: Se reemplazó el fallo silencioso en la inscripción por un bloque `try/catch` robusto que muestra alertas detalladas con información técnica de Supabase (detalles, pistas y códigos de error).

### Gestión de Datos:
- **Fuga de Información**: Se detectó que los datos de un alumno persistían al abrir el modal de otro alumno. Se rediseñó la función `limpiarFormulario` para vaciar no solo los inputs visibles, sino también los IDs ocultos (`dataset`, hidden inputs) y estados globales.

## 3. Módulo de Grupos y Cierre de Ciclo

### Interfaz de Usuario:
- **Botón de Guardado Desaparecido**: Se restauró el botón "GUARDAR" en el modal de Cierre de Ciclo tanto en el HTML como forzando su visibilidad mediante JavaScript al disparar la acción de promoción.
- **Scroll en Selectores**: Se corrigió un bug visual donde solo se mostraban 7 elementos en las listas de selección (Instrumentos, Grupos). Se habilitó el desplazamiento vertical (`overflow-y: auto`) y se aumentaron los límites de consulta a 500 registros.

## 4. Gestión Fiscal (RFC)

### Conectividad:
- **Fallo de Botones**: Se corrigió la inicialización del cliente de Supabase en `rfc-clientes.js`, asegurando que la conexión se establezca correctamente al cargar el módulo.

---

**Estado Actual**: El sistema se encuentra en una fase estable para pruebas de usuario final. Se recomienda validar el flujo completo: *Búsqueda de Alumno -> Identificación de Deuda -> Pago en Caja -> Verificación de Estatus.*
