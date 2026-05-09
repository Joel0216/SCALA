import re

# Leer archivo SQL
with open('C:/Users/PC05/Downloads/Scala/DATOS-MOVIMIENTOS-COMPLETO.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Extraer IDs de encabezados
encabezado_pattern = r'\((\d+),\s*(?:NULL|\'[\d-]+\'),\s*\'[A-Z]+\',\s*NULL\)'
encabezados_matches = re.findall(encabezado_pattern, content)
encabezado_ids = set(int(m) for m in encabezados_matches)

print(f"IDs de encabezados encontrados: {len(encabezado_ids)}")
print(f"Rango: {min(encabezado_ids)} - {max(encabezado_ids)}")

# Encontrar líneas de detalles con IDs inválidos
detalle_pattern = r'\((\d+),\s*\'[^\']+\',\s*-?\d+,\s*\d+\.\d+\)'
lines = content.split('\n')

valid_lines = []
removed_count = 0
removed_ids = set()

for line in lines:
    # Si es una línea de detalle
    match = re.search(detalle_pattern, line)
    if match:
        mov_id = int(match.group(1))
        # Si el movimiento_id NO existe en encabezados
        if mov_id not in encabezado_ids:
            removed_count += 1
            removed_ids.add(mov_id)
            print(f"Removiendo detalle con movimiento_id={mov_id}: {line.strip()[:80]}...")
            continue
    
    valid_lines.append(line)

print(f"\nTotal líneas removidas: {removed_count}")
print(f"IDs de movimientos huérfanos: {sorted(removed_ids)}")

# Guardar archivo corregido
with open('C:/Users/PC05/Downloads/Scala/DATOS-MOVIMIENTOS-COMPLETO.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(valid_lines))

# Contar detalles válidos finales
final_detalle_count = len([l for l in valid_lines if re.search(detalle_pattern, l)])
print(f"\nDetalles válidos finales: {final_detalle_count}")
print("Archivo corregido guardado.")
