# Documentación: Módulo de Recibos Cancelados (Auditoría)

Este documento resume las mejoras, correcciones y nuevas funcionalidades implementadas en el sistema SCALA para la gestión y auditoría de recibos cancelados.

## 1. Nueva Interfaz Independiente (`recibos_cancelados.html/js`)
Se ha separado la funcionalidad de historial de cancelados en un módulo independiente para evitar conflictos visuales en la pantalla de cobros.
- **Diseño Estilo Access**: Formulario con estética retro y profesional (bordes en 3D, colores grises) para facilitar la lectura administrativa.
- **Búsqueda por Credencial**: Ya no es necesario buscar el folio manualmente. Al buscar un alumno por su credencial, el sistema **carga automáticamente** la información de la última cancelación realizada.
- **Selector de Folios**: Si un alumno tiene múltiples cancelaciones, aparece un menú para elegir entre ellas.

## 2. Mejoras en la Integridad de Datos
El proceso de cancelación ahora captura un conjunto completo de metadatos para fines legales y de auditoría:
- **IVA y Totales**: Se guarda el desglose exacto de impuestos y descuentos del momento de la transacción.
- **Datos de Facturación**: Nombre, RFC y Dirección registrados al momento de emitir el recibo.
- **Detalles de Pago**: Referencias de tarjeta, folios de transferencia y montos exactos recibidos / cambio entregado.
- **Restauración de Stock**: Al cancelar un recibo, el inventario de artículos se actualiza automáticamente sumando las cantidades devueltas.

## 3. Correcciones Técnicas Críticas (Bug Fixes)
- **Error UUID vs BigInt**: Se corrigió el error `invalid input syntax for type bigint` migrando el campo `original_id` a tipo `UUID` en Supabase para que sea compatible con los identificadores del sistema principal.
- **IDs de Botones en JS**: Se rodearon los IDs (UUIDs) de los botones de borrar con comillas en el `onclick` para evitar errores de sintaxis en el navegador.
- **Gestión de Referencias Nulas**: Se añadieron comprobaciones de seguridad (`safety checks`) para evitar cierres inesperados de la página si faltaban etiquetas en el HTML.
- **Flujo de Trabajo más Veloz**: Se eliminaron los cuadros de diálogo redundantes ("¿Desea ir al historial?") para que la caja pueda seguir cobrando sin interrupciones.

## 4. Impresión Formato Carta
- **Tamaño Carta (8.5" x 11")**: La impresión del recibo cancelado ahora ocupa el tamaño estándar solicitado.
- **Marca de Agua**: Incluye un mensaje de **CANCELADO - AUDITORÍA** de gran tamaño al fondo para evitar el mal uso de documentos viejos.

---
> [!NOTE]
> Todos los cambios han sido consolidados en el repositorio local. Para asegurar la funcionalidad completa, asegúrate de haber ejecutado el script `fix_cancelled_schema_types.sql` en tu Supabase SQL Editor.
