import re
import xlrd
from datetime import datetime, timedelta

def excel_date_to_sql(excel_date):
    if excel_date is None or excel_date == '':
        return 'NULL'
    try:
        if isinstance(excel_date, (int, float)):
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

print("=== REGENERANDO DATOS LIMPIOS ===\n")

# Leer encabezados
wb_enc = xlrd.open_workbook('C:/Users/PC05/Downloads/Scala/Scala tablas/Movimientos de Inventarios.xls')
ws_enc = wb_enc.sheet_by_index(0)

encabezados = []
for row in range(1, ws_enc.nrows):
    num_mov = ws_enc.cell_value(row, 0)
    tipo_mov = ws_enc.cell_value(row, 1)
    fecha = ws_enc.cell_value(row, 2)
    
    if num_mov != '':
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

encabezado_ids = set(enc['id'] for enc in encabezados)
print(f"Encabezados: {len(encabezados)}")

# Leer detalles
wb_det = xlrd.open_workbook('C:/Users/PC05/Downloads/Scala/Scala tablas/Movimientos de Inventarios Det.xls')
ws_det = wb_det.sheet_by_index(0)

detalles = []
removidos_unknown = 0
removidos_huerfanos = 0

for row in range(1, ws_det.nrows):
    mov_id = ws_det.cell_value(row, 0)
    clave = ws_det.cell_value(row, 1)
    cantidad = ws_det.cell_value(row, 2)
    precio = ws_det.cell_value(row, 3)
    
    if mov_id != '':
        try:
            mov_id_val = int(float(mov_id))
            clave_str = str(clave).strip() if clave else 'UNKNOWN'
            
            # Filtrar UNKNOWN
            if clave_str == 'UNKNOWN' or clave_str == '':
                removidos_unknown += 1
                continue
            
            # Filtrar huérfanos
            if mov_id_val not in encabezado_ids:
                removidos_huerfanos += 1
                continue
            
            detalles.append({
                'movimiento_id': mov_id_val,
                'clave': clave_str,
                'cantidad': int(float(cantidad)) if cantidad else 0,
                'precio': float(precio) if precio else 0.00
            })
        except Exception as e:
            pass

print(f"Detalles válidos: {len(detalles)}")
print(f"Removidos UNKNOWN: {removidos_unknown}")
print(f"Removidos huérfanos: {removidos_huerfanos}")

# Generar SQL
sql_lines = [
    f"-- Generado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
    f"-- Encabezados: {len(encabezados)} | Detalles: {len(detalles)}",
    f"-- Removidos: {removidos_unknown} UNKNOWN + {removidos_huerfanos} huérfanos\n",
    "INSERT INTO tipos_movimiento (clave, descripcion) VALUES",
    "('AD', 'NUEVA ADQUISICIÓN'),('DE', 'DEVOLUCIÓN'),('ME', 'MOVTO INTERNO ENT.'),",
    "('MS', 'MOVTO INTERNO SAL.'),('P', 'PRÉSTAMO'),('R', 'RECEPCION'),('S', 'SALIDA')",
    "ON CONFLICT (clave) DO NOTHING;\n",
    
    f"INSERT INTO movimientos_encabezado (id, fecha, tipo_movimiento, observaciones) VALUES"
]

enc_inserts = [f"({e['id']}, {excel_date_to_sql(e['fecha'])}, '{e['tipo'].replace(chr(39), chr(39)+chr(39))}', NULL)" for e in encabezados]
sql_lines.append(",\n".join(enc_inserts))
sql_lines.append("ON CONFLICT (id) DO NOTHING;\n")

sql_lines.append(f"INSERT INTO movimientos_detalle (movimiento_id, clave_articulo, cantidad, precio) VALUES")

det_inserts = [f"({d['movimiento_id']}, '{d['clave'].replace(chr(39), chr(39)+chr(39))}', {d['cantidad']}, {d['precio']:.2f})" for d in detalles]
sql_lines.append(",\n".join(det_inserts))
sql_lines.append(";")

with open('C:/Users/PC05/Downloads/Scala/DATOS-MOVIMIENTOS-COMPLETO.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_lines))

print(f"\n✅ Archivo regenerado con {len(detalles)} detalles")
