import xlrd
from datetime import datetime, timedelta

def excel_date_to_sql(excel_date):
    """Convierte fecha de Excel a formato SQL YYYY-MM-DD"""
    if excel_date is None or excel_date == '':
        return 'NULL'
    try:
        if isinstance(excel_date, (int, float)):
            # Excel fecha base es 1899-12-30
            base_date = datetime(1899, 12, 30)
            delta = timedelta(days=float(excel_date))
            result_date = base_date + delta
            return f"'{result_date.strftime('%Y-%m-%d')}'"
        elif isinstance(excel_date, datetime):
            return f"'{excel_date.strftime('%Y-%m-%d')}'"
        else:
            return 'NULL'
    except:
        return 'NULL'

print("=== EXTRAYENDO DATOS DE XLS ===\n")

# ============================================
# LEER ENCABEZADOS (113 registros esperados)
# ============================================
print("Leyendo Movimientos de Inventarios.xls...")
wb_enc = xlrd.open_workbook('C:/Users/PC05/Downloads/Scala/Scala tablas/Movimientos de Inventarios.xls')
ws_enc = wb_enc.sheet_by_index(0)

print(f"  Filas en hoja: {ws_enc.nrows}")
print(f"  Columnas: {ws_enc.ncols}")

# Leer headers
headers = [ws_enc.cell_value(0, col) for col in range(ws_enc.ncols)]
print(f"  Headers: {headers}")

encabezados = []
for row in range(1, ws_enc.nrows):
    num_mov = ws_enc.cell_value(row, 0)
    tipo_mov = ws_enc.cell_value(row, 1)
    fecha = ws_enc.cell_value(row, 2)
    
    if num_mov != '':  # Solo si tiene número de movimiento
        try:
            id_val = int(float(num_mov)) if num_mov else 0
            if id_val > 0:
                encabezados.append({
                    'id': id_val,
                    'tipo': str(tipo_mov).strip() if tipo_mov else 'S',
                    'fecha': fecha
                })
        except:
            pass

print(f"✓ Encabezados extraídos: {len(encabezados)}\n")

# ============================================
# LEER DETALLES (485 registros esperados)
# ============================================
print("Leyendo Movimientos de Inventarios Det.xls...")
wb_det = xlrd.open_workbook('C:/Users/PC05/Downloads/Scala/Scala tablas/Movimientos de Inventarios Det.xls')
ws_det = wb_det.sheet_by_index(0)

print(f"  Filas en hoja: {ws_det.nrows}")
print(f"  Columnas: {ws_det.ncols}")

# Leer headers
headers_det = [ws_det.cell_value(0, col) for col in range(ws_det.ncols)]
print(f"  Headers: {headers_det}")

detalles = []
for row in range(1, ws_det.nrows):
    mov_id = ws_det.cell_value(row, 0)
    clave = ws_det.cell_value(row, 1)
    cantidad = ws_det.cell_value(row, 2)
    precio = ws_det.cell_value(row, 3)
    
    if mov_id != '':  # Solo si tiene movimiento ID
        try:
            mov_id_val = int(float(mov_id)) if mov_id else 0
            if mov_id_val > 0:
                detalles.append({
                    'movimiento_id': mov_id_val,
                    'clave': str(clave).strip() if clave else 'UNKNOWN',
                    'cantidad': int(float(cantidad)) if cantidad else 0,
                    'precio': float(precio) if precio else 0.00
                })
        except Exception as e:
            print(f"  Error en fila {row}: {e}")

print(f"✓ Detalles extraídos: {len(detalles)}\n")

# ============================================
# GENERAR SQL COMPLETO
# ============================================
print("Generando SQL completo...")

sql_lines = [
    "-- ============================================",
    "-- DATOS COMPLETOS: Movimientos de Inventario",
    "-- ============================================",
    f"-- Generado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
    f"-- Encabezados: {len(encabezados)} registros",
    f"-- Detalles: {len(detalles)} registros",
    "-- ============================================\n",
    
    "-- ==================== TIPOS DE MOVIMIENTO ====================",
    "INSERT INTO tipos_movimiento (clave, descripcion) VALUES",
    "('AD', 'NUEVA ADQUISICIÓN'),",
    "('DE', 'DEVOLUCIÓN'),",
    "('ME', 'MOVTO INTERNO ENT.'),",
    "('MS', 'MOVTO INTERNO SAL.'),",
    "('P', 'PRÉSTAMO'),",
    "('R', 'RECEPCION'),",
    "('S', 'SALIDA')",
    "ON CONFLICT (clave) DO NOTHING;\n",
    
    f"-- ==================== MOVIMIENTOS ENCABEZADO ({len(encabezados)} registros) ====================",
    "INSERT INTO movimientos_encabezado (id, fecha, tipo_movimiento, observaciones) VALUES"
]

# Generar INSERTs de encabezados
enc_inserts = []
for enc in encabezados:
    id_val = enc['id']
    fecha_val = excel_date_to_sql(enc['fecha'])
    tipo_val = enc['tipo'].replace("'", "''")
    enc_inserts.append(f"({id_val}, {fecha_val}, '{tipo_val}', NULL)")

sql_lines.append(",\n".join(enc_inserts))
sql_lines.append("ON CONFLICT (id) DO NOTHING;\n")

# Generar INSERTs de detalles
sql_lines.append(f"-- ==================== MOVIMIENTOS DETALLE ({len(detalles)} registros) ====================")
sql_lines.append("INSERT INTO movimientos_detalle (movimiento_id, clave_articulo, cantidad, precio) VALUES")

det_inserts = []
for det in detalles:
    mov_id = det['movimiento_id']
    clave = det['clave'].replace("'", "''")
    cant = det['cantidad']
    precio = f"{det['precio']:.2f}"
    det_inserts.append(f"({mov_id}, '{clave}', {cant}, {precio})")

sql_lines.append(",\n".join(det_inserts))
sql_lines.append(";\n")

# Resetear secuencia y verificación
sql_lines.extend([
    "-- ==================== RESETEAR SECUENCIA ====================",
    "SELECT setval('movimientos_encabezado_id_seq', (SELECT MAX(id) FROM movimientos_encabezado));\n",
    
    "-- ==================== VERIFICACIÓN ====================",
    "SELECT ",
    "    'Carga completada' AS mensaje,",
    "    (SELECT COUNT(*) FROM tipos_movimiento) AS tipos,",
    "    (SELECT COUNT(*) FROM movimientos_encabezado) AS movimientos,",
    "    (SELECT COUNT(*) FROM movimientos_detalle) AS detalles;"
])

# Guardar archivo
output_file = 'C:/Users/PC05/Downloads/Scala/DATOS-MOVIMIENTOS-COMPLETO.sql'
with open(output_file, 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_lines))

print(f"\n✅ COMPLETADO!")
print(f"Archivo generado: {output_file}")
print(f"Total encabezados: {len(encabezados)}")
print(f"Total detalles: {len(detalles)}")

# Mostrar muestra
print("\n=== MUESTRA DE ENCABEZADOS (primeros 5) ===")
for i, enc in enumerate(encabezados[:5], 1):
    print(f"  {i}. ID:{enc['id']:3d} | Tipo:{enc['tipo']:3s} | Fecha:{enc['fecha']}")

print("\n=== MUESTRA DE DETALLES (primeros 5) ===")
for i, det in enumerate(detalles[:5], 1):
    print(f"  {i}. Mov:{det['movimiento_id']:3d} | Art:{det['clave']:15s} | Cant:{det['cantidad']:4d} | $:{det['precio']:.2f}")

print("\n🎉 ¡Extracción completada exitosamente!")
