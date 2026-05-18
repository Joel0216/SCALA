// crear-instalador.js - Compilador automatizado de SCALA
const { execSync } = require('child_process');
const path = require('path');

console.log("==========================================================");
console.log("          SCALA - GENERADOR DE INSTALADOR (.EXE)");
console.log("==========================================================");
console.log("");
console.log("Este script preparará el entorno y creará el instalador");
console.log("de SCALA para que puedas usarlo en cualquier PC Windows.");
console.log("");

// Paso 1: Instalar dependencias
console.log("==========================================================");
console.log("Paso 1: Instalando dependencias de empaquetado (npm install)...");
console.log("Esto puede tardar un momento, por favor espera...");
console.log("");

try {
    execSync('npm install', { stdio: 'inherit' });
    console.log("");
    console.log("✓ Dependencias instaladas correctamente.");
    console.log("");
} catch (error) {
    console.error("\n❌ Error durante npm install. Asegúrate de tener conexión a internet.");
    process.exit(1);
}

// Paso 2: Compilar el instalador
console.log("==========================================================");
console.log("Paso 2: Compilando la aplicación y creando el instalador (npm run build)...");
console.log("Esto puede tomar entre 1 y 3 minutos.");
console.log("");

try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log("");
    console.log("==========================================================");
    console.log("                   ¡COMPILACIÓN EXITOSA!                  ");
    console.log("==========================================================");
    console.log("");
    console.log("El instalador se ha creado correctamente en la carpeta:");
    console.log(path.join(__dirname, 'dist'));
    console.log("");
    console.log("Archivos generados:");
    console.log("1. Scala Setup 1.0.0.exe (Instalador tradicional)");
    console.log("2. Scala-Portable-1.0.0.exe (Versión Portable)");
    console.log("");
    
    // Intentar abrir la carpeta al finalizar
    try {
        const distPath = path.join(__dirname, 'dist');
        if (process.platform === 'win32') {
            execSync(`explorer "${distPath}"`);
        }
    } catch (e) {
        // Ignorar si no se puede abrir el explorador
    }
} catch (error) {
    console.error("\n❌ Error durante la compilación de la aplicación.");
    process.exit(1);
}
