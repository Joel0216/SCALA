const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

function generateSQL() {
    let sql = `-- ==========================================
-- 1. TABLA DE INSTRUMENTOS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.instrumentos (
    clave VARCHAR(50) PRIMARY KEY,
    descripcion VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==========================================
-- 2. TABLA DE SALONES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.salones (
    numero INTEGER PRIMARY KEY,
    ubicacion VARCHAR(255),
    cupo INTEGER NOT NULL DEFAULT 0,
    instrumentos_texto TEXT, -- Respaldo del texto original migrado
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==========================================
-- 3. TABLA RELACIONAL SALON <-> INSTRUMENTOS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.salon_instrumentos (
    id SERIAL PRIMARY KEY,
    salon_numero INTEGER REFERENCES public.salones(numero) ON DELETE CASCADE,
    instrumento_clave VARCHAR(50) REFERENCES public.instrumentos(clave) ON DELETE CASCADE,
    cantidad INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Limpiar si ya existen datos para recargar
TRUNCATE TABLE public.salon_instrumentos CASCADE;
TRUNCATE TABLE public.salones CASCADE;
TRUNCATE TABLE public.instrumentos CASCADE;

`;

    // 1. INSTRUMENTOS
    const instFile = path.join(__dirname, 'Scala tablas', 'tablainstrumento.xls');
    if (fs.existsSync(instFile)) {
        const sheet = xlsx.readFile(instFile).Sheets[xlsx.readFile(instFile).SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);
        if (data.length > 0) {
            sql += `\n-- Insertar Instrumentos\n`;
            data.forEach(row => {
                const c = (row.QueInstrumento || '').toString().replace(/'/g, "''").trim();
                const d = (row.DescripcionInst || '').toString().replace(/'/g, "''").trim();
                if (c && d) {
                    sql += `INSERT INTO public.instrumentos (clave, descripcion) VALUES ('${c}', '${d}');\n`;
                }
            });
        }
    }

    // 2. SALONES
    const salFile = path.join(__dirname, 'Scala tablas', 'Salones.xls');
    if (fs.existsSync(salFile)) {
        const sheet = xlsx.readFile(salFile).Sheets[xlsx.readFile(salFile).SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);
        if (data.length > 0) {
            sql += `\n-- Insertar Salones\n`;
            data.forEach(row => {
                const s = parseInt(row.Salon);
                const u = (row.Ubicacion || '').toString().replace(/'/g, "''").trim();
                const c = parseInt(row.Cupo) || 0;
                const ins_text = (row.Instrumentos || '').toString().replace(/'/g, "''").trim();
                if (!isNaN(s)) {
                    sql += `INSERT INTO public.salones (numero, ubicacion, cupo, instrumentos_texto) VALUES (${s}, '${u}', ${c}, '${ins_text}');\n`;
                }
            });
        }
    }

    fs.writeFileSync(path.join(__dirname, 'instrumentos_salones.sql'), sql);
    console.log("SQL file generated: instrumentos_salones.sql");
}

generateSQL();
