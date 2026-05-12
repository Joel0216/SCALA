/**
 * UTILS-INPUTS.JS
 * Sistema de diálogos personalizados para Electron (evita bloqueo de inputs)
 */

// Estilos para los diálogos
const estilosDialogo = document.createElement('style');
estilosDialogo.textContent = `
    .dialogo-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 99999;
    }
    .dialogo-box {
        background: #2d2d2d;
        border: 2px solid #4a4a4a;
        border-radius: 8px;
        padding: 20px 30px;
        min-width: 300px;
        max-width: 500px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .dialogo-mensaje {
        color: #fff;
        font-size: 16px;
        margin-bottom: 20px;
        line-height: 1.5;
    }
    .dialogo-botones {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
    }
    .dialogo-btn {
        padding: 10px 25px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
    }
    .dialogo-btn-ok {
        background: #4CAF50;
        color: white;
    }
    .dialogo-btn-ok:hover {
        background: #45a049;
    }
    .dialogo-btn-cancel {
        background: #666;
        color: white;
    }
    .dialogo-btn-cancel:hover {
        background: #555;
    }
    .dialogo-input {
        width: 100%;
        padding: 10px;
        margin-bottom: 15px;
        border: 1px solid #555;
        border-radius: 4px;
        background: #3d3d3d;
        color: white;
        font-size: 14px;
    }
`;
document.head.appendChild(estilosDialogo);

// Función para mostrar alerta personalizada
function mostrarAlerta(mensaje) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'dialogo-overlay';
        overlay.innerHTML = `
            <div class="dialogo-box">
                <div class="dialogo-mensaje">${mensaje}</div>
                <div class="dialogo-botones">
                    <button class="dialogo-btn dialogo-btn-ok" id="btnDialogoOk">Aceptar</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const btnOk = overlay.querySelector('.dialogo-btn-ok');
        btnOk.focus();

        btnOk.onclick = () => {
            overlay.remove();
            resolve();
        };

        // También cerrar con Enter o Escape
        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === 'Escape') {
                overlay.remove();
                resolve();
            }
        });
    });
}

// Función para mostrar confirmación personalizada
function mostrarConfirm(mensaje) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'dialogo-overlay';
        overlay.innerHTML = `
            <div class="dialogo-box">
                <div class="dialogo-mensaje">${mensaje}</div>
                <div class="dialogo-botones">
                    <button class="dialogo-btn dialogo-btn-cancel" id="btnDialogoNo">No</button>
                    <button class="dialogo-btn dialogo-btn-ok" id="btnDialogoSi">Sí</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const btnSi = overlay.querySelector('.dialogo-btn-ok');
        const btnNo = overlay.querySelector('.dialogo-btn-cancel');
        btnSi.focus();

        btnSi.onclick = () => {
            overlay.remove();
            resolve(true);
        };

        btnNo.onclick = () => {
            overlay.remove();
            resolve(false);
        };

        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                overlay.remove();
                resolve(true);
            } else if (e.key === 'Escape') {
                overlay.remove();
                resolve(false);
            }
        });
    });
}

// Función para mostrar prompt personalizado
function mostrarPrompt(mensaje, valorDefault = '') {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'dialogo-overlay';
        overlay.innerHTML = `
            <div class="dialogo-box">
                <div class="dialogo-mensaje">${mensaje}</div>
                <input type="text" class="dialogo-input" id="inputDialogo" value="${valorDefault}">
                <div class="dialogo-botones">
                    <button class="dialogo-btn dialogo-btn-cancel" id="btnDialogoCancel">Cancelar</button>
                    <button class="dialogo-btn dialogo-btn-ok" id="btnDialogoOk">Aceptar</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const btnOk = overlay.querySelector('.dialogo-btn-ok');
        const btnCancel = overlay.querySelector('.dialogo-btn-cancel');
        const input = overlay.querySelector('.dialogo-input');

        input.focus();
        input.select();

        btnOk.onclick = () => {
            overlay.remove();
            resolve(input.value);
        };

        btnCancel.onclick = () => {
            overlay.remove();
            resolve(null);
        };

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const valor = input.value;
                overlay.remove();
                resolve(valor);
            } else if (e.key === 'Escape') {
                overlay.remove();
                resolve(null);
            }
        });
    });
}

// REEMPLAZAR las funciones nativas
window.alertOriginal = window.alert;
window.confirmOriginal = window.confirm;
window.promptOriginal = window.prompt;

// Nueva función alert (síncrona para compatibilidad)
window.alert = function (mensaje) {
    mostrarAlerta(mensaje);
};

// Para confirm necesitamos una versión que funcione con código existente
// Mantenemos el original pero agregamos la versión async
window.confirmar = mostrarConfirm;
window.preguntar = mostrarPrompt;
window.alerta = mostrarAlerta;

// Función para habilitar inputs (SOLO si no estamos en modo solo consulta)
function habilitarInputs() {
    // Si el SessionManager indica que estamos en modo Solo Consulta, NO habilitar nada
    if (typeof SessionManager !== 'undefined' && SessionManager.isReadOnly) {
        return;
    }

    document.querySelectorAll('input:not([readonly]), select, textarea:not([readonly]), button').forEach(el => {
        // No habilitar botones que el SessionManager ha ocultado explícitamente
        if (el.style.display === 'none') return;
        
        el.disabled = false;
        el.style.pointerEvents = 'auto';
    });
    document.body.style.pointerEvents = 'auto';
}

// Habilitar inputs periódicamente
setInterval(habilitarInputs, 500);

// Eventos para habilitar inputs
document.addEventListener('click', () => setTimeout(habilitarInputs, 10), true);
document.addEventListener('keydown', () => setTimeout(habilitarInputs, 10), true);
window.addEventListener('focus', habilitarInputs);

// Exportar
window.habilitarInputs = habilitarInputs;
window.mostrarAlerta = mostrarAlerta;
window.mostrarConfirm = mostrarConfirm;
window.mostrarPrompt = mostrarPrompt;

console.log('✓ utils-inputs.js cargado - Diálogos personalizados activos');
