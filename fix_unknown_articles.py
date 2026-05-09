import re

# Leer archivo SQL
with open('C:/Users/PC05/Downloads/Scala/DATOS-MOVIMIENTOS-COMPLETO.sql', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Filtrar líneas que NO contengan 'UNKNOWN'
filtered_lines = []
removed_count = 0

for line in lines:
    if "'UNKNOWN'" in line and 'INSERT INTO movimientos_detalle' not in line:
        removed_count += 1
        print(f"Removiendo: {line.strip()}")
    else:
        filtered_lines.append(line)

print(f"\nTotal líneas removidas: {removed_count}")

# Guardar archivo corregido
with open('C:/Users/PC05/Downloads/Scala/DATOS-MOVIMIENTOS-COMPLETO.sql', 'w', encoding='utf-8') as f:
    f.writelines(filtered_lines)

print("Archivo corregido guardado.")
