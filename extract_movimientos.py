import xlrd
import json
from datetime import datetime, timedelta

# Función para convertir fechas de Excel a formato SQL
def excel_date_to_sql(excel_date):
    if not excel_date or excel_date == '':
        return None
    try:
        # Excel fecha base es 1899-12-30
        base_date = datetime(1899, 12, 30)
        delta = timedelta(days=float(excel_date))
        result_date = base_date + delta
        return result_date.strftime('%Y-%m-%d')
    except:
        return None

# Leer encabezados
print("=== MOVIMIENTOS ENCABEZADO ===")
wb_enc = xlrd.open_workbook('C:/Users/PC05/Downloads/Scala/Scala tablas/Movimientos de Inventarios.xls')
ws_enc = wb_enc.sheet_by_index(0)

# Headers
headers_enc = [ws_enc.cell_value(0, col) for col in range(ws_enc.ncols)]
print(f"Headers: {headers_enc}")
print(f"Total rows: {ws_enc.nrows}")

# Sample data
print("\n=== SAMPLE DATA (first 5 rows) ===")
for row in range(1, min(6, ws_enc.nrows)):
    values = [ws_enc.cell_value(row, col) for col in range(ws_enc.ncols)]
    print(f"Row {row}: {values}")

# Todos los tipos de movimiento únicos
print("\n=== TIPOS DE MOVIMIENTO ÚNICOS ===")
tipos = set()
for row in range(1, ws_enc.nrows):
    tipo = ws_enc.cell_value(row, 1)  # Columna Tipo de Movimiento
    if tipo:
        tipos.add(str(tipo).strip())
print(f"Tipos encontrados: {sorted(tipos)}")

# Leer detalles
print("\n\n=== MOVIMIENTOS DETALLE ===")
wb_det = xlrd.open_workbook('C:/Users/PC05/Downloads/Scala/Scala tablas/Movimientos de Inventarios Det.xls')
ws_det = wb_det.sheet_by_index(0)

# Headers
headers_det = [ws_det.cell_value(0, col) for col in range(ws_det.ncols)]
print(f"Headers: {headers_det}")
print(f"Total rows: {ws_det.nrows}")

# Sample data
print("\n=== SAMPLE DATA (first 5 rows) ===")
for row in range(1, min(6, ws_det.nrows)):
    values = [ws_det.cell_value(row, col) for col in range(ws_det.ncols)]
    print(f"Row {row}: {values}")

# Exportar datos completos a JSON para análisis
print("\n\n=== EXPORTANDO A JSON ===")
enc_data = []
for row in range(1, ws_enc.nrows):
    enc_data.append({
        headers_enc[col]: ws_enc.cell_value(row, col) 
        for col in range(ws_enc.ncols)
    })

det_data = []
for row in range(1, ws_det.nrows):
    det_data.append({
        headers_det[col]: ws_det.cell_value(row, col) 
        for col in range(ws_det.ncols)
    })

with open('movimientos_encabezado.json', 'w', encoding='utf-8') as f:
    json.dump(enc_data, f, indent=2, ensure_ascii=False)

with open('movimientos_detalle.json', 'w', encoding='utf-8') as f:
    json.dump(det_data, f, indent=2, ensure_ascii=False)

print("Datos exportados a JSON")
