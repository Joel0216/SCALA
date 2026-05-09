const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

function inspectExcel(filename) {
    const fullPath = path.join(__dirname, 'Scala tablas', filename);
    if (!fs.existsSync(fullPath)) {
        console.log(`File not found: ${fullPath}`);
        return;
    }
    const workbook = xlsx.readFile(fullPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    if (data.length > 0) {
        console.log(`--- ${filename} ---`);
        console.log("Columns:", Object.keys(data[0]));
        console.log("First row:", data[0]);
    }
}

inspectExcel('Grupos.xls');
