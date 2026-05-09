const fs = require('fs');

const raw = fs.readFileSync('cursos_clean.txt', 'utf8').split('\n');

const garbage = [
    '333333', 'MS Sans Serif', 'Page', 'General', '0.00', 'Microsoft', 'Capacity', 'Length',
    'PC05ce', 'Cursos-', 'Curso', 'Costo', 'Clave', 'Recargo', 'curso', 'siguiente',
    '-MMM', 'CTRICA', 'N INDIVID', 'Microsoft JET', 'VILLAGE'
];

// Datos conocidos (64 registros) con precios correctos
const knownData = [
    { curso: 'PIANO PREPARATORIO', precio: 780.00, inscripcion: 200.00 },
    { curso: 'PIANO 1', precio: 780.00, inscripcion: 200.00 },
    { curso: 'PIANO 2', precio: 780.00, inscripcion: 200.00 },
    { curso: 'PIANO 3', precio: 850.00, inscripcion: 200.00 },
    { curso: 'PIANO 4', precio: 850.00, inscripcion: 200.00 },
    { curso: 'PIANO 5', precio: 920.00, inscripcion: 200.00 },
    { curso: 'PIANO 6', precio: 920.00, inscripcion: 200.00 },
    { curso: 'PIANO INFANTIL', precio: 780.00, inscripcion: 200.00 },
    { curso: 'PIANO INDIVIDUAL', precio: 1200.00, inscripcion: 250.00 },
    { curso: 'GUITARRA ACUSTICA 1', precio: 600.00, inscripcion: 180.00 },
    { curso: 'GUITARRA ACUSTICA 2', precio: 600.00, inscripcion: 180.00 },
    { curso: 'GUITARRA ACUSTICA 3', precio: 650.00, inscripcion: 180.00 },
    { curso: 'GUITARRA ACUSTICA 4', precio: 650.00, inscripcion: 180.00 },
    { curso: 'GUITARRA ACUSTICA 5', precio: 700.00, inscripcion: 180.00 },
    { curso: 'GUITARRA ACUSTICA 6', precio: 700.00, inscripcion: 180.00 },
    { curso: 'GUITARRA ACUSTICA INDIVIDUAL 1', precio: 1100.00, inscripcion: 220.00 },
    { curso: 'Guitarra Electrica 1', precio: 600.00, inscripcion: 180.00 },
    { curso: 'Guitarra Electrica 2', precio: 600.00, inscripcion: 180.00 },
    { curso: 'Guitarra Electrica 3', precio: 650.00, inscripcion: 180.00 },
    { curso: 'Guitarra Electrica 4', precio: 650.00, inscripcion: 180.00 },
    { curso: 'Guitarra Electrica 5', precio: 700.00, inscripcion: 180.00 },
    { curso: 'Guitarra Electrica 6', precio: 700.00, inscripcion: 180.00 },
    { curso: 'Guitarra Electrica Individual', precio: 1100.00, inscripcion: 220.00 },
    { curso: 'Bateria 1', precio: 780.00, inscripcion: 200.00 },
    { curso: 'Bateria 2', precio: 780.00, inscripcion: 200.00 },
    { curso: 'Bateria 3', precio: 850.00, inscripcion: 200.00 },
    { curso: 'Bateria 4', precio: 850.00, inscripcion: 200.00 },
    { curso: 'Bateria 5', precio: 920.00, inscripcion: 200.00 },
    { curso: 'Bateria 6', precio: 920.00, inscripcion: 200.00 },
    { curso: 'BATERIA INFANTIL', precio: 780.00, inscripcion: 200.00 },
    { curso: 'BATERIA INDIVIDUAL 1', precio: 1200.00, inscripcion: 250.00 },
    { curso: 'Bajo Electrico 1', precio: 780.00, inscripcion: 200.00 },
    { curso: 'Bajo Electrico 2', precio: 780.00, inscripcion: 200.00 },
    { curso: 'Bajo Electrico 3', precio: 850.00, inscripcion: 200.00 },
    { curso: 'Bajo Electrico 4', precio: 850.00, inscripcion: 200.00 },
    { curso: 'Bajo Individual 1', precio: 1200.00, inscripcion: 250.00 },
    { curso: 'CANTO', precio: 590.00, inscripcion: 150.00 },
    { curso: 'CANTO INDIVIDUAL', precio: 1150.00, inscripcion: 220.00 },
    { curso: 'CANTO INFANTIL', precio: 590.00, inscripcion: 150.00 },
    { curso: 'VIOLIN 1', precio: 900.00, inscripcion: 220.00 },
    { curso: 'VIOLIN 2', precio: 900.00, inscripcion: 220.00 },
    { curso: 'VIOLIN 3', precio: 950.00, inscripcion: 220.00 },
    { curso: 'VIOLIN INFANTIL', precio: 900.00, inscripcion: 220.00 },
    { curso: 'VIOLIN INDIVIDUAL', precio: 1300.00, inscripcion: 280.00 },
    { curso: 'Teclado Pop 1', precio: 780.00, inscripcion: 200.00 },
    { curso: 'Teclado Pop 2', precio: 780.00, inscripcion: 200.00 },
    { curso: 'TECLADO INFANTIL', precio: 780.00, inscripcion: 200.00 },
    { curso: 'Baby Music', precio: 780.00, inscripcion: 200.00 },
    { curso: 'DRUM KIDS', precio: 780.00, inscripcion: 200.00 },
    { curso: 'DRUM KIDS INDIVIDUAL', precio: 1200.00, inscripcion: 250.00 },
    { curso: 'INICIACION MUSICAL', precio: 600.00, inscripcion: 150.00 },
    { curso: 'INICIACION MUSICAL 1', precio: 600.00, inscripcion: 150.00 },
    { curso: 'INICIACION MUSICAL 2', precio: 600.00, inscripcion: 150.00 },
    { curso: 'ABC Music&Me', precio: 780.00, inscripcion: 200.00 },
    { curso: 'ABC ENGLISH & ME', precio: 780.00, inscripcion: 200.00 },
    { curso: 'ABC HOME SWEET HOME', precio: 780.00, inscripcion: 200.00 },
    { curso: 'ENGLISH MUSIC', precio: 780.00, inscripcion: 200.00 },
    { curso: 'ENSAMBLE', precio: 600.00, inscripcion: 150.00 },
    { curso: 'CORO NAVIDEÑO', precio: 500.00, inscripcion: 100.00 },
    { curso: 'TEORIA MUSICAL', precio: 500.00, inscripcion: 100.00 },
    { curso: 'INSCRIPCION', precio: 0.00, inscripcion: 200.00 },
    { curso: 'ANUALIDAD', precio: 450.00, inscripcion: 0.00 }
];

// Mapa para búsqueda rápida
const priceMap = new Map();
knownData.forEach(d => {
    priceMap.set(d.curso.toUpperCase().trim(), { p: d.precio, i: d.inscripcion });
});

const knownCourses = new Set();
const finalCourses = [];

function cleanLine(line) {
    return line.trim();
}

function isGarbage(line) {
    const upper = line.toUpperCase();
    if (line.length < 3) return true;
    if (/^\d+(\.\d+)?$/.test(line)) return true; // Numbers
    if (upper.includes('333333')) return true;
    if (garbage.some(g => upper.includes(g.toUpperCase()))) return true;
    return false;
}

function generarClave(curso) {
    const clean = curso.replace(/[^A-Z0-9 ]/g, '');
    const words = clean.split(' ').filter(w => w.length > 0);
    if (words.length === 1) return words[0].substring(0, 2);
    if (words.length >= 2) return words[0][0] + words[1][0];
    return 'XX';
}

raw.forEach(line => {
    const cleaned = cleanLine(line);
    if (isGarbage(cleaned)) return;

    if (/[^a-zA-Z0-9\s\.\-\&\(\)]/.test(cleaned)) {
        // Skip weird chars
    }

    if (!knownCourses.has(cleaned.toUpperCase())) {
        knownCourses.add(cleaned.toUpperCase());
        finalCourses.push(cleaned);
    }
});

// Generate SQL
let sql = `-- DATOS CURSOS COMPLETOS (${finalCourses.length} registros)\n`;
sql += `INSERT INTO cursos (clave, curso, precio_mensual, precio_inscripcion, iva, activo) VALUES\n`;

const values = [];
const usedClaves = new Set();

finalCourses.sort().forEach(curso => {
    const cursoUpper = curso.toUpperCase().trim();
    let clave = generarClave(cursoUpper);

    // Unique key logic
    let counter = 1;
    let baseClave = clave;
    while (usedClaves.has(clave)) {
        clave = baseClave + counter;
        counter++;
    }
    usedClaves.add(clave);

    // Look up price
    let precio = 780.00; // Default
    let inscripcion = 200.00; // Default

    if (priceMap.has(cursoUpper)) {
        precio = priceMap.get(cursoUpper).p;
        inscripcion = priceMap.get(cursoUpper).i;
    }

    values.push(`('${clave}', '${curso.replace(/'/g, "''").toUpperCase()}', ${precio}, ${inscripcion}, 0.16, true)`);
});

sql += values.join(',\n') + ';\n';

console.log(`Found ${finalCourses.length} courses.`);
fs.writeFileSync('DATOS-CURSOS-COMPLETOS.sql', sql);
