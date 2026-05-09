// preload.js - Script de precarga para Electron
// Este archivo se ejecuta antes de cargar la página

// Nota: Con contextIsolation: false, no usamos contextBridge
// Las variables se exponen directamente al window

window.addEventListener('DOMContentLoaded', () => {
    console.log('Electron Preload: Página cargada');
    
    // Información del sistema
    if (typeof process !== 'undefined') {
        console.log('Node version:', process.versions.node);
        console.log('Chrome version:', process.versions.chrome);
        console.log('Electron version:', process.versions.electron);
        
        // Exponer información de Electron
        window.isElectron = true;
        window.electronVersions = {
            node: process.versions.node,
            chrome: process.versions.chrome,
            electron: process.versions.electron
        };
    }
});
