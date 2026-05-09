import re

# Leer claves de artículos existentes desde DATOS-ARTICULOS.sql
print("Leyendo artículos existentes...")
with open('C:/Users/PC05/Downloads/Scala/DATOS-ARTICULOS.sql', 'r', encoding='utf-8') as f:
    articulos_content = f.read()

# Extraer claves de artículos (primera columna en los INSERT VALUES)
articulo_pattern = r"\('([^']+)',"
articulos_matches = re.findall(articulo_pattern, articulos_content)
claves_validas = set(articulos_matches)

print(f"Claves de artículos válidas encontradas: {len(claves_validas)}")
print(f"Muestra: {list(claves_validas)[:10]}")

# Leer archivo de movimientos
with open('C:/Users/PC05/Downloads/Scala/DATOS-MOVIMIENTOS-COMPLETO.sql', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Filtrar detalles solo con claves válidas
valid_lines = []
removed_count = 0
invalid_claves = set()

detalle_pattern = r"\((\d+),\s*'([^']+)',\s*(-?\d+),\s*(\d+\.\d+)\)"

for line in lines:
    match = re.search(detalle_pattern, line)
    if match:
        mov_id, clave, cantidad, precio = match.groups()
        # Si la clave NO existe en artículos
        if clave not in claves_validas:
            removed_count += 1
            invalid_claves.add(clave)
            continue
    
    valid_lines.append(line)

print(f"\nDetalles removidos por clave inválida: {removed_count}")
print(f"Claves inválidas únicas: {len(invalid_claves)}")
print(f"Ejemplos de claves inválidas: {list(invalid_claves)[:20]}")

# Contar detalles válidos finales
final_count = len([l for l in valid_lines if re.search(detalle_pattern, l)])
print(f"\nDetalles válidos finales: {final_count}")

# Guardar archivo corregido
with open('C:/Users/PC05/Downloads/Scala/DATOS-MOVIMIENTOS-COMPLETO.sql', 'w', encoding='utf-8') as f:
    f.writelines(valid_lines)

print("Archivo corregido guardado.")
