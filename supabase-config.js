/**
 * supabase-config.js - Senior Stability Version
 * Configuración centralizada para Electron + Supabase
 */

// 1. Definiciones constantes y estado
const SUPABASE_URL = 'https://vettrowqbtonrzrrvshk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldHRyb3dxYnRvbnJ6cnJ2c2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1OTc4NzQsImV4cCI6MjA5MzE3Mzg3NH0.aeWYoDOI_fHLoBWIjqrlGX_POMyvUd0pfOrvleLcu2k';

let supabaseClient = null;
let isReady = false;
const startTime = Date.now();

// 2. Definición temprana de helpers para evitar "not a function" logic
window.getSupabase = function () {
    return supabaseClient || window.supabase;
};

window.waitForSupabase = function (timeout = 30000) {
    return new Promise((resolve, reject) => {
        if (isReady && (supabaseClient || window.supabase)) {
            resolve(supabaseClient || window.supabase);
            return;
        }

        let elapsed = 0;
        const checkInterval = setInterval(() => {
            elapsed += 200;
            const client = supabaseClient || window.supabase;

            if (client?.from) {
                isReady = true;
                clearInterval(checkInterval);
                console.log(`✓ SUPABASE LISTO EN ${Date.now() - startTime}ms`);
                resolve(client);
            } else if (elapsed >= timeout) {
                clearInterval(checkInterval);
                console.error(`❌ TIMEOUT esperando Supabase (${timeout}ms)`);
                reject(new Error('Timeout esperando Supabase'));
            }
        }, 200);
    });
};

// 3. Inicialización Automática
(function init() {
    console.log('=== INICIALIZANDO SUPABASE (MODO SENIOR) ===');

    try {
        // Prioridad: Electron require
        if (typeof require !== 'undefined') {
            try {
                const { createClient } = require('@supabase/supabase-js');
                if (createClient) {
                    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                    window.supabase = supabaseClient;
                    isReady = true;
                    console.log('✓ Inicializado via require (NodeIntegration)');
                }
            } catch (e) {
                console.warn('require(@supabase/supabase-js) no disponible, intentando CDN...');
            }
        }

        // Fallback: Browser CDN
        if (!isReady && window.supabase?.createClient) {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            window.supabase = supabaseClient;
            isReady = true;
            console.log('✓ Inicializado via CDN');
        }

        if (isReady) {
            console.log("[supabase-config] Cliente listo:", !!window.supabase);
            document.dispatchEvent(new CustomEvent('supabaseReady', { detail: { supabase: supabaseClient } }));
        }

    } catch (err) {
        console.error('❌ [supabase-config] ERROR CRÍTICO EN INICIALIZACIÓN:', err);
    }
})();

// Exportar constantes
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
