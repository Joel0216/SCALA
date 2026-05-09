const XLSX = require('xlsx');
const excelPath = "C:\\Users\\PC05\\Downloads\\Scala\\Scala tablas\\Maestros.xls";
const workbook = XLSX.readFile(excelPath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);
if (data.length > 0) {
    console.log("Raw Headers:", Object.keys(data[0]));
} else {
    console.log("No data found");
}
