import re

def clean_name(name):
    # Remove non-printable or weird chars
    return name.strip()

def generate_clave(name):
    words = name.upper().split()
    if len(words) == 1:
        return words[0][:2]
    elif len(words) >= 2:
        return words[0][0] + words[1][0]
    return "XX"

def load_existing_data(sql_file):
    data = {}
    try:
        with open(sql_file, 'r', encoding='utf-8') as f:
            content = f.read()
            matches = re.findall(r"\('([^']*)', '([^']*)', ([0-9]+), ([0-9]+), ([0-9.]+), true, (NULL|'[^']*')\)", content)
            for m in matches:
                # Key: Curso Name. Value: (Clave, Price, Inscripcion, Next)
                data[m[1].upper()] = {
                    'clave': m[0],
                    'costo': m[2],
                    'recargo': m[3],
                    'siguiente': m[5] if m[5] != 'NULL' else None
                }
    except Exception as e:
        print(f"Error loading existing data: {e}")
    return data

def process_dump(dump_file):
    courses = []
    with open(dump_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    start_processing = False
    seen = set()
    
    # Heuristic: Start after header
    for line in lines:
        line = line.strip()
        if not line: continue
        if line == "Curso": # Header found
            start_processing = True
            continue
        if not start_processing:
            if "ABC ENGLISH" in line or "Bajo Electrico" in line: # Fallback start
                start_processing = True
            else:
                continue
                
        # Filter noise
        if len(line) < 3: continue
        if "333333" in line: continue
        if "$" in line: continue 
        if "MS Sans Serif" in line: continue
        if "Page &p" in line: continue
        if line in ["Costo", "Clave", "IVA", "Recargo", "curso_siguiente"]: continue
        
        # It's a potential course name
        # if line.upper() not in seen:
        courses.append(line)
        # seen.add(line.upper())
            
    return courses


# 2. Logic to detect 'Curso Siguiente'
# Pattern: If we see [Name A], [Name B], [Name B], it usually means A -> B.
# If we see [Name A], [Name A], it usually means A -> NULL (ends chain).

existing = load_existing_data('DATOS-CURSOS-COMPLETOS.sql')
dump_courses = process_dump('cursos_dump_utf8.txt')

print(f"-- Found {len(dump_courses)} courses from dump")

siguientes_map = {} # Map from Course Name -> Siguiente Course Name

clean_stream = []
# Filter duplicates only if they are clearly noise? No, the repetition is KEY.
# We keep the "valid course name" stream preserving order and repetitions.

for line in dump_courses:
    clean_stream.append(line)

for i in range(len(clean_stream) - 2):
    current = clean_stream[i]
    next_item = clean_stream[i+1]
    next_next = clean_stream[i+2]
    
    # We are looking for the "Name" of a record.
    # If we assume 'current' is a Name.
    
    # Case 1: Transition A -> B
    # A, B, B ... (B starts next record, so A's 'next' col was B)
    if current != next_item and next_item == next_next:
        siguientes_map[current.upper()] = next_item
        
    # Case 2: End of chain A -> NULL
    # A, A ... (A followed by itself usually means no differing 'next' col present, or self-loop?)
    # Based on 'Bajo 6', 'Bajo 6', 'Bajo Individual 1', it seems 'Bajo 6' -> NULL.
    
    # Note: This simple lookahead might miss edge cases but covers the 1->2->3 pattern dominating the file.

# Special pass for special cases or manual overrides if needed
# (e.g. ABC English -> ABC Home Sweet Home was A, B, B, B)

# Merge
final_courses = []
seen_claves = set()

# We need a unique list of courses to INSERT. 
# deduplicate dump_courses but keep order
unique_courses_list = []
seen_names = set()
for c in dump_courses:
    if c.upper() not in seen_names:
        unique_courses_list.append(c)
        seen_names.add(c.upper())

for course_name in unique_courses_list:
    upper_name = course_name.upper()
    
    # Defaults
    clave = generate_clave(course_name)
    costo = 0
    recargo = 0
    siguiente = siguientes_map.get(upper_name, None) # Default to None if not found in map
    
    if upper_name in existing:
        rec = existing[upper_name]
        clave = rec['clave']
        costo = rec['costo']
        recargo = rec['recargo']
        # Prefer our extracted 'siguiente' over the NULL in existing, unless existing had a real value?
        # existing 'siguiente' was all NULL in previous step.
        
    # Ensure unique clave
    base_clave = clave
    counter = 1
    while clave in seen_claves:
        clave = f"{base_clave}{counter}"
        counter += 1
    seen_claves.add(clave)
    
    final_courses.append({
        'curso': course_name,
        'costo': costo,
        'clave': clave,
        'iva': 0.16,
        'recargo': recargo,
        'siguiente': siguiente
    })

# Write SQL
with open('INSERT_CURSOS_FINAL.sql', 'w', encoding='utf-8') as f:
    f.write("-- DATOS FINALES DE CURSOS (Extracted directly from Cursos.xls)\n")
    f.write("-- Columns: Curso, Costo, Clave, Iva, Recargo, Curso siguiente\n")
    f.write("INSERT INTO cursos (curso, precio_mensual, clave, iva, precio_inscripcion, curso_siguiente) VALUES\n")
    
    values = []
    for c in final_courses:
        siguiente_val = f"'{c['siguiente']}'" if c['siguiente'] else "NULL"
        val = f"('{c['curso']}', {c['costo']}, '{c['clave']}', {c['iva']}, {c['recargo']}, {siguiente_val})"
        values.append(val)
        
    f.write(",\n".join(values) + ";\n")

print(f"Generated INSERT_CURSOS_FINAL.sql with {len(values)} records.")
