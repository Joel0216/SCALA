const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

function readExcel(filename) {
    const fullPath = path.join(__dirname, 'Scala tablas', filename);
    if (!fs.existsSync(fullPath)) {
        console.log(`File not found: ${fullPath}`);
        return null;
    }
    const workbook = xlsx.readFile(fullPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(sheet);
}

const clientes = readExcel('RFC Clientes.xls');
const credenciales = readExcel('RFC Credenciales.xls');

console.log('--- RFC Clientes ---');
if (clientes && clientes.length > 0) {
    console.log(Object.keys(clientes[0]));
    console.log(clientes.slice(0, 3));
}

console.log('\n--- RFC Credenciales ---');
if (credenciales && credenciales.length > 0) {
    console.log(Object.keys(credenciales[0]));
    console.log(credenciales.slice(0, 3));
}
