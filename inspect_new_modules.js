const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

function readExcel(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return;
    }
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    console.log(`\n--- ${path.basename(filePath)} ---`);
    if (data.length > 0) {
        console.log("Columns:", Object.keys(data[0]));
        console.log("Sample Data (First 3):", data.slice(0, 3));
        console.log("Total rows:", data.length);
    } else {
        console.log("Empty sheet.");
    }
}

readExcel('c:/Users/PC05/Downloads/Scala/Scala tablas/tablainstrumento.xls');
readExcel('c:/Users/PC05/Downloads/Scala/Scala tablas/Salones.xls');
