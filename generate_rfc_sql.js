const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

function readExcel(filename) {
    const fullPath = path.join(__dirname, 'Scala tablas', filename);
    if (!fs.existsSync(fullPath)) {
        return [];
    }
    const workbook = xlsx.readFile(fullPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(sheet);
}

const clientes = readExcel('RFC Clientes.xls');
const credenciales = readExcel('RFC Credenciales.xls');

let sql = `-- ==========================================
-- RFC CLIENTES Y CREDENCIALES
-- ==========================================

-- 1. Tabla rfc_clientes
CREATE TABLE public.rfc_clientes (
    rfc VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    direccion1 VARCHAR(255),
    direccion2 VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabla rfc_credenciales (Relación RFC-Alumno)
CREATE TABLE public.rfc_credenciales (
    id SERIAL PRIMARY KEY,
    rfc VARCHAR(50) REFERENCES public.rfc_clientes(rfc) ON DELETE CASCADE,
    credencial INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Inserción de RFC Clientes\n`;

// Escape quotes for SQL
function esc(str) {
    if (!str) return 'NULL';
    return "'" + String(str).replace(/'/g, "''") + "'";
}

for (let i = 0; i < clientes.length; i += 50) {
    const chunk = clientes.slice(i, i + 50);
    sql += "INSERT INTO public.rfc_clientes (rfc, nombre, direccion1, direccion2) VALUES \n";
    sql += chunk.map(c => `(${esc(c.RFC)}, ${esc(c.Nombre)}, ${esc(c.Direccion1)}, ${esc(c.Direccion2)})`).join(",\n") + ";\n\n";
}

sql += "\n-- 4. Inserción de RFC Credenciales\n";
const validCreds = credenciales.filter(c => c.RFC && c.Credencial);
for (let i = 0; i < validCreds.length; i += 50) {
    const chunk = validCreds.slice(i, i + 50);
    sql += "INSERT INTO public.rfc_credenciales (rfc, credencial) VALUES \n";
    sql += chunk.map(c => `(${esc(c.RFC)}, ${c.Credencial})`).join(",\n") + ";\n\n";
}

fs.writeFileSync('rfc_clientes.sql', sql);
console.log('SQL generated at rfc_clientes.sql');
