const fs = require('fs');

// Datos extraídos de DATOS-INICIALES-SUPABASE.sql (64 registros)
const cursosRaw = [
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

function generarClave(curso) {
    const palabras = curso.trim().toUpperCase().split(' ').filter(p => p.length > 0 && isNaN(p) && p !== '&');
    if (palabras.length === 1) {
        return palabras[0].substring(0, 2);
    } else if (palabras.length >= 2) {
        return palabras[0].charAt(0) + palabras[1].charAt(0);
    }
    return 'XX';
}

let sql = `-- INSERT CURSOS (Generado Automáticamente)\n`;
sql += `INSERT INTO cursos (clave, curso, precio_mensual, precio_inscripcion, iva, activo) VALUES\n`;

const values = [];
const clavesGeneradas = new Set();

cursosRaw.forEach(c => {
    let clave = generarClave(c.curso);

    // Manejo de duplicados básicos
    let counter = 1;
    let originalClave = clave;
    while (clavesGeneradas.has(clave)) {
        clave = originalClave + counter;
        counter++;
    }
    clavesGeneradas.add(clave);

    values.push(`('${clave}', '${c.curso.replace(/'/g, "''").toUpperCase()}', ${c.precio}, ${c.inscripcion}, 0.16, true)`);
});

sql += values.join(',\n') + ';\n';

console.log(sql);
fs.writeFileSync('DATOS-CURSOS-GENERADOS.sql', sql);
