// Inicializar Supabase
let supabase = null;

// Esperar a que se cargue la librería de Supabase
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM cargado, inicializando caja...');

    // Esperar a que Supabase esté listo
    try {
        if (typeof waitForSupabase === 'function') {
            supabase = await waitForSupabase(10000);
        } else {
            // Esperar un poco y reintentar
            await new Promise(r => setTimeout(r, 1000));
            if (typeof waitForSupabase === 'function') {
                supabase = await waitForSupabase(10000);
            }
        }
    } catch (e) {
        console.error('Error conectando a Supabase:', e);
    }

    updateDateTime();
    setInterval(updateDateTime, 1000);

    // Configurar event listeners
    setupEventListeners();

    console.log('Inicialización de caja completa');
});

// Actualizar fecha y hora
function updateDateTime() {
    const now = new Date();
    const formatted = now.toLocaleString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    const datetimeElement = document.getElementById('datetime');
    if (datetimeElement) {
        datetimeElement.textContent = formatted;
    }
}

// Configurar todos los event listeners
function setupEventListeners() {
    // Botón Cobros
    const cobrosBtn = document.querySelector('.top-left');
    if (cobrosBtn) {
        cobrosBtn.addEventListener('click', irACobros);
    }

    // Botón Recibos Cancelados
    const recibosCanceladosBtn = document.querySelector('.top-right');
    if (recibosCanceladosBtn) {
        recibosCanceladosBtn.addEventListener('click', irARecibosCancelados);
    }

    // Botón Consulta y Bajas
    const consultaBajasBtn = document.querySelector('.center-btn');
    if (consultaBajasBtn) {
        consultaBajasBtn.addEventListener('click', irAConsultaBajas);
    }

    // Botón Corte 1
    const corte1Btn = document.querySelector('.bottom-left');
    if (corte1Btn) {
        corte1Btn.addEventListener('click', () => {
            alert('Reporte CORTE 1 en desarrollo');
        });
    }

    // Botón Corte 2
    const corte2Btn = document.querySelector('.bottom-center');
    if (corte2Btn) {
        corte2Btn.addEventListener('click', () => {
            alert('Reporte CORTE 2 en desarrollo');
        });
    }

    // Botón Corte 3
    const corte3Btn = document.querySelector('.bottom-right');
    if (corte3Btn) {
        corte3Btn.addEventListener('click', () => {
            alert('Reporte CORTE 3 en desarrollo');
        });
    }

    // Botón Terminar
    const terminarBtn = document.querySelector('.exit-btn');
    if (terminarBtn) {
        terminarBtn.addEventListener('click', terminarCaja);
    }
}

// Funciones para botones (también disponibles como onclick)
// Funciones para botones (globales para onclick)
window.irACobros = function() {
    window.location.href = 'cobros.html';
}

window.irARecibosCancelados = function() {
    window.location.href = 'recibos_cancelados.html';
}

window.irAConsultaBajas = function() {
    window.location.href = 'consulta-bajas.html';
}

window.generarCorte1 = function() {
    window.location.href = 'cortes.html?corte=1';
}

window.generarCorte2 = function() {
    window.location.href = 'cortes.html?corte=2';
}

window.generarCorte3 = function() {
    window.location.href = 'cortes.html?corte=3';
}

window.terminarCaja = function() {
    window.location.href = 'index.html';
}
