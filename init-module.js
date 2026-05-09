/**
 * INIT-MODULE.JS
 * Función común para inicializar módulos con Supabase
 * Incluir después de supabase-config.js y antes del módulo específico
 */

// Variable global para el cliente de Supabase
let supabase = null;

// Función para inicializar un módulo
async function inicializarModulo(nombreModulo, callbackInit) {
    console.log(`Inicializando módulo: ${nombreModulo}...`);
    
    try {
        // Esperar a que Supabase esté disponible
        let intentos = 0;
        while (typeof waitForSupabase !== 'function' && intentos < 20) {
            await new Promise(r => setTimeout(r, 200));
            intentos++;
        }
        
        if (typeof waitForSupabase === 'function') {
            supabase = await waitForSupabase(10000);
            console.log(`✓ Supabase conectado para ${nombreModulo}`);
        } else {
            console.warn(`⚠ waitForSupabase no disponible para ${nombreModulo}`);
        }
        
        // Ejecutar callback de inicialización
        if (typeof callbackInit === 'function') {
            await callbackInit();
        }
        
        console.log(`✓ Módulo ${nombreModulo} inicializado`);
        
    } catch (error) {
        console.error(`Error inicializando ${nombreModulo}:`, error);
    }
    
    // Habilitar inputs
    if (typeof habilitarInputs === 'function') {
        habilitarInputs();
    }
}

// Exportar
window.inicializarModulo = inicializarModulo;
