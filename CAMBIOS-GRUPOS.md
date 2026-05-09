# Mejoras Implementadas en el Módulo de Grupos

## ✅ Cambios Realizados

### 1. **Generación Automática de Clave**
- **Formato**: Código Curso + Iniciales Maestro + Día + Hora
- **Ejemplo**: `ABCMLGLU17` = ABC (curso) + MLG (Melissa López González) + LU (Lunes) + 17 (hora)
- La clave se genera automáticamente al seleccionar:
  - Curso
  - Maestro
  - Día
  - Hora de entrada
- Se genera en el momento de dar "Alta"

### 2. **Botón de Altas (Modal Azul)**
- Al hacer clic en "Altas" se abre un modal azul con todos los campos:
  - **Clave**: Se genera automáticamente (readonly)
  - **Curso**: Selección de cursos disponibles
  - **Maestro**: Selección de maestros disponibles
  - **Día**: Lunes a Domingo
  - **Hora Entrada/Salida**: Formato HH:MM
    - Validación: Horas 01-24, Minutos 00-59
    - Solo números, sin letras ni caracteres especiales
  - **Inicio**: Calendario para seleccionar fecha
  - **Salón**: Muestra salones con su cupo
  - **Cupo**: Solo números (default: 10)
  - **Alumnos**: Solo números, readonly (inicia en 0)
  - **Lección**: Permite edición (default: "Null")
  - **Fecha Lección**: Permite edición
- Botones:
  - **Guardar**: Crea el nuevo grupo
  - **Cancelar**: Cancela y cierra el modal

### 3. **Búsqueda Mejorada**
- Botón "Buscar" (sin "X Maestro")
- **Búsqueda flexible**:
  - Por clave del grupo (completa o parcial)
  - Por nombre del maestro (completo o parcial)
  - Por primera letra de la clave o maestro
  - No distingue mayúsculas/minúsculas

- **Resultados múltiples**:
  - Si hay un solo resultado, lo carga automáticamente
  - Si hay varios resultados, muestra tabla con:
    - Clave
    - Curso
    - Maestro
    - Día
    - Hora
  - Click en cualquier fila para seleccionar ese grupo

- **Interfaz estilo Windows**:
  - Modal con barra azul superior
  - Botón de cerrar (X)
  - Diseño consistente con otros módulos

### 4. **Borrado con Confirmación**
- **Requisitos para borrar**:
  - Debe tener un grupo cargado con información completa
  - Muestra advertencia si no hay grupo seleccionado

- **Proceso de borrado**:
  1. Click en "Borrar"
  2. Aparece modal "¿Borrar Grupo?" con:
     - Información del grupo (Clave, Curso, Maestro)
     - Campo obligatorio para descripción de la razón
  3. Dos opciones:
     - **Sí - Confirmar**: Pide razón y elimina el grupo
     - **No**: Cancela y regresa sin borrar

- **Modal de confirmación**:
  - Borde rojo para indicar acción peligrosa
  - Campo de texto para razón del borrado (obligatorio)
  - Validación de razón antes de confirmar

### 5. **Edición con Restricciones**
- **Campos editables**:
  - Día
  - Curso
  - Maestro
  - Hora de entrada y salida
  - Salón
  - Fecha de inicio (con restricción)

- **Restricción de fecha de inicio**:
  - Si la fecha de inicio ya pasó: NO se puede modificar
  - Si la fecha de inicio aún no llega: SÍ se puede modificar
  - Ejemplo: Si hoy es 01/02/26 y se creó el 30/01/26, ya no se puede cambiar
  - Muestra mensaje informativo según el caso

- **Validación de cambios**:
  - Si no hay cambios y se hace clic en "Guardar": Muestra "No ha habido ningún cambio"
  - Si hay cambios sin guardar y se hace clic en "Cancelar": Pregunta si desea perder los cambios

- **Botones**:
  - **Guardar**: Guarda los cambios realizados
  - **Cancelar**: Cancela y regresa sin guardar

### 6. **Validación de Horarios**
- **Formato estricto**: HH:MM
- **Validaciones**:
  - Horas: 01 a 24
  - Minutos: 00 a 59
  - Solo números, sin letras ni caracteres especiales
- Mensajes de error claros si el formato es incorrecto

### 7. **Botón Info Grupo Eliminado**
- Se eliminó el botón "Info Grupo" como solicitado
- La información se muestra directamente en el formulario principal

### 8. **Listado**
- Se abre con la información del grupo actual seleccionado
- Requiere tener un grupo cargado previamente con "Buscar"
- Abre en nueva ventana

### 9. **Botón Terminar**
- Regresa a la página anterior (archivos.html)
- Sin confirmación adicional

## 🎨 Mejoras Visuales

- **Modales con estilo Windows 95/98** consistente
- **Modal de Altas**: Fondo azul claro (#E6F2FF) con borde azul (#4169E1)
- **Modal de Edición**: Mismo estilo azul que Altas
- **Modal de Borrado**: Borde y encabezado rojo para indicar peligro
- **Tablas de resultados**: Hover azul para mejor UX
- **Botones con efecto 3D**: outset/inset
- **Textos informativos**: En gris claro e itálica

## 🔧 Funcionalidad Técnica

- **Generación automática de clave**: Basada en curso, maestro, día y hora
- **Validaciones completas**: Antes de guardar/borrar/editar
- **Manejo de errores**: Con mensajes claros
- **Soporte para Enter**: En campos de búsqueda
- **Comparación de cambios**: En modo edición
- **Restricción de fechas**: Basada en fecha actual vs fecha de inicio
- **Búsqueda case-insensitive**: Para mejor experiencia
- **Carga dinámica de selects**: Con datos de la base de datos

## 📝 Estructura de la Clave

La clave del grupo se genera con el siguiente formato:

```
CLAVE = [3 letras del curso] + [3 iniciales del maestro] + [2 letras del día] + [2 dígitos de la hora]
```

**Ejemplos**:
- `ABCMLGLU17`: Curso ABC, Maestra Melissa López González, Lunes 17:00
- `GUIJCAMA14`: Curso GUITARRA, Maestro Juan Carlos Martínez, Martes 14:00
- `PIAMRGVI10`: Curso PIANO, Maestra María Rodríguez García, Viernes 10:00

## 🔄 Flujo de Trabajo

### Alta de Grupo:
1. Click en "Altas"
2. Seleccionar Curso, Maestro, Día, Hora
3. La clave se genera automáticamente
4. Completar resto de campos
5. Click en "Guardar"

### Búsqueda de Grupo:
1. Click en "Buscar"
2. Escribir clave, nombre de maestro o letra inicial
3. Si hay múltiples resultados, seleccionar de la tabla
4. El grupo se carga en el formulario

### Edición de Grupo:
1. Buscar y cargar el grupo
2. Click en "Edición"
3. Modificar campos permitidos
4. Click en "Guardar" o "Cancelar"

### Borrado de Grupo:
1. Buscar y cargar el grupo
2. Click en "Borrar"
3. Confirmar con razón del borrado
4. Click en "Sí - Confirmar" o "No"

## ✨ Notas Importantes

- Todos los cambios son compatibles con la estructura existente de la base de datos
- Se mantiene la funcionalidad original de navegación de alumnos y pagos
- Interfaz consistente con los módulos de Maestros y Factores
- Sin errores de sintaxis o diagnósticos
- Validaciones robustas para evitar datos incorrectos
- Mensajes de error claros y descriptivos
