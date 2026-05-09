# 📦 Módulo de Artículos - Documentación Técnica

## 📋 Descripción General

El módulo de Artículos es un sistema completo de gestión de inventario para la aplicación SCALA. Permite crear, buscar, editar y eliminar artículos con un sistema inteligente de generación de claves automáticas.

---

## 🎯 Características Principales

### 1. **Generación Inteligente de Claves**

#### 🆕 Modo Nuevo
- **Lógica de Iniciales**: Toma la primera letra de cada palabra importante
  - Ejemplo: `"Violín Infantil"` → `VI`
  - Ejemplo: `"Guitarra Acústica Económica"` → `GAE`
  - Ejemplo: `"Libro de Solfeo"` → `LS` (ignora "de")

#### 📝 Modo Edición
- **Auto-regeneración Activa**: Al cambiar la descripción, la clave se recalcula automáticamente
- **Excepción**: Si el usuario borra la clave y escribe una manual, se respeta su decisión

#### 🔍 Detección de Duplicados
- Verifica si la clave generada ya existe en la base de datos
- **Excluye el artículo actual** al editar (no choca consigo mismo)
- Agrega número secuencial automáticamente:
  - Si `VI` existe → `VI1`
  - Si `VI1` existe → `VI2`
  - Y así sucesivamente...

#### ⚠️ Palabras Ignoradas
Filtra artículos y preposiciones comunes:
```javascript
['DE', 'DEL', 'LA', 'LAS', 'EL', 'LOS', 'Y', 'E', 'EN', 'A', 'AL', 'LO']
```

---

### 2. **Búsqueda Dinámica**
- **Modal de Búsqueda**: Ventana independiente (`articulos-lista.html`)
- **Filtrado en Tiempo Real**: Por clave, descripción y grupo
- **Debouncing**: Optimiza el rendimiento al escribir rápido (300ms)

---

### 3. **Modal de Edición (Estilo Maestros)**
- **Diseño Visual**: Fondo azul royal (`#4169E1`) con bordes oscuros
- **Campos Editables**:
  - ✏️ Descripción (auto-regenera clave)
  - 🔢 Precio
  - 💰 IVA
  - 📊 Stock
  - 🏷️ Grupo (dropdown dinámico)
- **Clave**: Se recalcula al cambiar descripción

---

### 4. **Validación Estricta Antes de Guardar**

#### ❌ Validación de Descripción Duplicada
```javascript
if (descripcionDuplicada) {
    alert('Error: Ya existe un artículo con la descripción exacta...');
    return;
}
```

#### ❌ Validación de Clave Duplicada
```javascript
if (claveDuplicada) {
    // Auto-genera nueva clave con número secuencial
    const nuevaClave = await generarClaveInteligente(descripcion, articuloIdActual);
    alert('La clave ya está en uso. Se usará: ' + nuevaClave);
}
```

---

### 5. **Eliminación con Auditoría**
- **Modal de Confirmación**: Requiere confirmación explícita
- **Razón Obligatoria**: Solicita motivo de la baja
- **Registro en Consola**: Log con razón, fecha y datos del artículo

---

## 📁 Estructura de Archivos

```
Scala/
├── articulos.html           # Formulario principal
├── articulos.js             # Lógica de negocio
├── articulos.css            # Estilos (incluye modal azul)
├── articulos-lista.html     # Modal de búsqueda
├── articulos-lista.js       # Lógica del buscador
├── SCHEMA-ARTICULOS.sql     # Schema de tabla Supabase
├── DATOS-ARTICULOS.sql      # 42 registros de ejemplo
└── DOCUMENTACION-ARTICULOS.md
```

---

## 🗄️ Base de Datos (Supabase)

### Tabla: `articulos`

| Campo         | Tipo      | Restricciones       | Descripción                  |
|---------------|-----------|---------------------|------------------------------|
| `id`          | SERIAL    | PRIMARY KEY         | ID autoincremental           |
| `clave`       | TEXT      | UNIQUE, NOT NULL    | Clave única del artículo     |
| `descripcion` | TEXT      | NOT NULL            | Descripción del artículo     |
| `grupo`       | TEXT      |                     | Categoría/grupo              |
| `precio`      | NUMERIC   | DEFAULT 0           | Precio unitario              |
| `iva`         | NUMERIC   | DEFAULT 0.16        | IVA (16% por defecto)        |
| `stock`       | INTEGER   | DEFAULT 0           | Cantidad en inventario       |

---

## 🔧 Funciones Clave

### `generarClaveInteligente(descripcion, articuloIdActual)`
Genera claves únicas con detección de duplicados.

**Parámetros:**
- `descripcion`: Texto del artículo
- `articuloIdActual`: ID del artículo (null en modo nuevo, ID en edición)

**Retorna:** String con clave única (ej. `VI`, `VI1`, `VI2`)

**Ejemplo:**
```javascript
const clave = await generarClaveInteligente("Violín Infantil", null);
// Retorna: "VI" (o "VI1" si "VI" ya existe)
```

---

### `regenerarClaveEnEdicion()`
Callback que se ejecuta al escribir en el campo descripción del modal de edición.

**Comportamiento:**
1. Captura descripción actual
2. Llama a `generarClaveInteligente()` excluyendo artículo actual
3. Actualiza campo clave en tiempo real

---

### `guardarEdicion()`
Valida y guarda cambios en Supabase.

**Validaciones:**
1. ✅ Campos obligatorios: Descripción y Grupo
2. ✅ Descripción única (no duplicada)
3. ✅ Clave única (auto-genera si hay conflicto)
4. ✅ Actualiza en Supabase

---

## 🎨 Diseño UI/UX

### Modal de Edición
```css
Background: #4169E1 (Royal Blue)
Border: 3px solid #1E3A8A (Dark Blue)
Header: #1E3A8A con texto blanco
Botones: Gradiente azul con borde 3D
```

### Validación Visual
- **Stock**: Solo acepta números (0-9 y guión)
- **Precio/IVA**: Decimales permitidos
- **Clave**: Solo lectura con fondo gris (`#e0e0e0`)

---

## 🚀 Flujo de Trabajo

### Crear Nuevo Artículo
1. Clic en "Nuevo"
2. Escribir descripción → **Clave se genera automáticamente**
3. Seleccionar grupo del dropdown
4. Ingresar precio, IVA y stock
5. Clic en "Guardar" → **Validación estricta**

### Editar Artículo Existente
1. Buscar artículo (modal o buscador principal)
2. Clic en "Editar" → **Abre modal azul**
3. Modificar descripción → **Clave se regenera automáticamente**
4. Ajustar otros campos si es necesario
5. Clic en "Guardar" → **Validación estricta**

### Eliminar Artículo
1. Seleccionar artículo
2. Clic en "Borrar"
3. Confirmar en diálogo
4. Ingresar razón de la baja (obligatorio)
5. Artículo eliminado con log en consola

---

## 📊 Datos de Ejemplo

El archivo `DATOS-ARTICULOS.sql` contiene **42 artículos** de ejemplo:

| Clave     | Descripción                    | Grupo                   | Precio  |
|-----------|--------------------------------|-------------------------|---------|
| ABC2013   | Paquete ABC 2013              | Materiales              | 950.00  |
| CI        | CANTO INFANTIL                | Métodos                 | 550.00  |
| VI        | VIOLIN INFANTIL               | Colegiaturas            | 200.00  |
| VII       | VIOLIN INFANTIL INDIVIDUAL    | Colegiaturas            | 550.00  |

---

## ⚡ Optimizaciones

1. **Debouncing en Búsqueda**: 300ms para reducir consultas
2. **Carga Asíncrona**: Todas las operaciones con Supabase usan `async/await`
3. **Event Listeners Dinámicos**: Se agregan/remueven según el modo
4. **Validación Cliente-Side**: Reduce llamadas a BD innecesarias

---

## 🐛 Manejo de Errores

- **Conexión BD**: Alert con mensaje de error de Supabase
- **Duplicados**: Alert informativo con sugerencia de nueva clave
- **Campos Vacíos**: Alert antes de enviar a BD
- **Eliminación Fallida**: Alert con detalles del error

---

## 🔐 Seguridad

- **UNIQUE Constraint**: Previene duplicados en BD
- **Validación Doble**: Cliente + Servidor (Supabase)
- **Sanitización**: `.trim()` y `.toUpperCase()` en todos los campos de texto
- **Auditoría**: Log de eliminaciones con razón y timestamp

---

## 📝 Notas Técnicas

### Limitaciones Conocidas
- Las claves se generan en **mayúsculas** siempre
- Solo se permiten **números positivos o negativos** en stock
- El campo `grupo` es texto libre (no tabla de catálogo)

### Mejoras Futuras Sugeridas
- [ ] Exportar inventario a Excel
- [ ] Gráficas de stock bajo
- [ ] Historial de cambios por artículo
- [ ] Códigos de barras/QR para artículos

---

## 📞 Soporte

Para dudas o reportar bugs, contacta al equipo de desarrollo.

**Última actualización**: 2026-02-15  
**Versión**: 1.0.0
