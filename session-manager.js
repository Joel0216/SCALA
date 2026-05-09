/**
 * session-manager.js - Gestión de sesión y permisos (NMC)
 */

const SessionManager = {
    /**
     * Obtiene el usuario actual desde localStorage
     */
    getCurrentUser: function() {
        const session = localStorage.getItem('scala_session');
        if (!session) return null;
        try {
            return JSON.parse(session);
        } catch (e) {
            return null;
        }
    },

    /**
     * Verifica si el usuario tiene una sesión activa
     */
    isLoggedIn: function() {
        return !!this.getCurrentUser();
    },

    /**
     * Cierra la sesión
     */
    logout: function() {
        localStorage.removeItem('scala_session');
        window.location.href = 'login.html';
    },

    /**
     * Verifica permisos para una sección
     * @param {string} seccion - Nombre de la sección (Archivos, Caja, etc.)
     * @returns {string} - 'N' (None), 'M' (Modify), 'C' (Consult)
     */
    getPermission: function(seccion) {
        const user = this.getCurrentUser();
        if (!user) return 'N';
        if (user.rol === 'SuperAdmin') return 'M'; // SuperAdmin tiene acceso total

        const p = user.permisos.find(item => item.seccion.toLowerCase() === seccion.toLowerCase());
        return p ? p.permiso : 'N'; // Por defecto N si no existe el registro
    },

    /**
     * Bloquea el acceso a la página si el permiso es 'N'
     */
    protectPage: function(seccion) {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
            return;
        }

        const p = this.getPermission(seccion);
        if (p === 'N') {
            alert('Acceso Denegado: No tiene permisos para esta sección.');
            window.location.href = 'index.html';
            return;
        }

        if (p === 'C') {
            this.applyReadOnlyMode();
        }
    },

    /**
     * Aplica modo de solo lectura (C) ocultando botones de guardado y deshabilitando inputs
     */
    applyReadOnlyMode: function() {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🔒 Aplicando modo SOLO CONSULTA');
            
            // Ocultar botones de guardado, edición, eliminación
            const btnSelectors = [
                'button[onclick*="guardar"]', 
                'button[onclick*="Save"]',
                'button[onclick*="eliminar"]',
                'button[onclick*="Delete"]',
                '.btn-save',
                '.btn-danger'
            ];
            
            btnSelectors.forEach(sel => {
                document.querySelectorAll(sel).forEach(el => el.style.display = 'none');
            });

            // Deshabilitar inputs, selectores y textareas
            document.querySelectorAll('input, select, textarea').forEach(el => {
                if (el.id !== 'buscarInput' && el.id !== 'inputBuscar') { // Permitir búsquedas
                    el.disabled = true;
                    el.style.opacity = '0.7';
                }
            });
        });
    },

    /**
     * Aplica el filtro de organizacion_id a una consulta de Supabase
    /**
     * Aplica el filtro de organizacion_id a una consulta de Supabase
     * @param {object} query - Objeto de consulta de Supabase
     * @returns {object} - Consulta filtrada
     */
    applyIsolation: function(query) {
        const user = this.getCurrentUser();
        if (!user) return query;
        if (user.rol === 'SuperAdmin') return query;
        
        return query.eq('organizacion_id', user.organizacion_id);
    },

    /**
     * Carga el branding (logo y títulos) en la página
     */
    loadBranding: function() {
        const user = this.getCurrentUser();
        if (!user) return;

        console.log('🖼️ Aplicando branding para:', user.nombre, `(${user.rol})`);
        
        const logoImg = document.getElementById('mainLogo');
        const orgTitle = document.getElementById('orgTitle');
        const orgHeader = document.getElementById('orgNameHeader');

        // 1. Actualizar Nombres/Títulos si existen en la página
        if (orgTitle) orgTitle.textContent = user.org_nombre || 'SCALA';
        if (orgHeader) orgHeader.textContent = user.org_nombre || 'SCALA';

        // 2. Actualizar Logo si existe el elemento img con id="mainLogo"
        if (logoImg) {
            const possiblePaths = [
                'Scala_logo.png', // Nueva prioridad según usuario
                'Scala logo.png',
                '../Scala logo.png',
                'file:///C:/Users/Joel%20Pool/Downloads/Scala2.0/Scala_logo.png',
                'file:///C:/Users/PC05/Downloads/Scala/Scala_logo.png'
            ];

            if (user.rol === 'SuperAdmin') {
                let pathIdx = 0;
                const tryNext = () => {
                    if (pathIdx < possiblePaths.length) {
                        logoImg.src = possiblePaths[pathIdx++];
                    } else {
                        // Fallback final: Logo de texto si no hay imagen
                        logoImg.style.display = 'none';
                        const textLogo = document.createElement('div');
                        textLogo.id = 'textLogoFallback';
                        textLogo.style = 'font-family: "Outfit", sans-serif; font-size: 1.5rem; font-weight: bold; color: var(--accent-primary); letter-spacing: 2px;';
                        textLogo.textContent = 'SCALA';
                        if (!document.getElementById('textLogoFallback')) {
                            logoImg.parentNode.appendChild(textLogo);
                        }
                        console.warn('❌ Logo no encontrado en ninguna ruta. Usando fallback de texto.');
                    }
                };
                logoImg.onerror = tryNext;
                tryNext();
            } else if (user.org_logo) {
                logoImg.src = user.org_logo;
                logoImg.onerror = () => { logoImg.src = 'Scala logo.png'; };
            } else {
                logoImg.src = 'Scala logo.png';
            }
        }
    }
};

// Auto-inicialización al cargar cualquier página que use este script
(function() {
    const seccion = document.body.getAttribute('data-section');
    if (seccion) {
        SessionManager.protectPage(seccion);
    }
    
    // Ejecutar branding en DOMContentLoaded para asegurar que los elementos existan
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SessionManager.loadBranding());
    } else {
        SessionManager.loadBranding();
    }
})();

window.SessionManager = SessionManager;
