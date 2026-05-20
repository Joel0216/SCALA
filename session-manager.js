/**
 * session-manager.js - Gestión de sesión y permisos (NMC)
 */

const SessionManager = {
    isReadOnly: false,
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
     * Obtiene el organizacion_id efectivo de la sesión actual
     */
    getEffectiveOrgId: function() {
        const user = this.getCurrentUser();
        if (!user) return null;
        if (user.rol === 'SuperAdmin') {
            const selectedOrg = sessionStorage.getItem('superadmin_org_id');
            return (selectedOrg && selectedOrg !== 'all') ? selectedOrg : null;
        }
        return user.organizacion_id;
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
     * Mapeo de secciones granulares a sus categorías padre
     */
    SECTION_PARENTS: {
        'Cambiar Password': 'SEGURIDAD', 'Usuario Nuevo': 'SEGURIDAD', 'Borrar Usuario': 'SEGURIDAD', 'Restricciones': 'SEGURIDAD',
        'Procesos Especiales': 'MANTENIMIENTO', 'Administracion Gral.': 'MANTENIMIENTO',
        'Cobros': 'CAJA', 'Consultas y Bajas': 'CAJA', 'Recibos Cancelados': 'CAJA', 'Corte 1': 'CAJA', 'Corte 2': 'CAJA', 'Corte 3': 'CAJA',
        'Alumnos': 'ARCHIVOS', 'Maestros': 'ARCHIVOS', 'Cursos': 'ARCHIVOS', 'Articulos': 'ARCHIVOS', 'Movim. Inventario': 'ARCHIVOS', 'Bajas': 'ARCHIVOS', 'Factores de Pago': 'ARCHIVOS', 'Grupos': 'ARCHIVOS', 'Grupos de Articulos': 'ARCHIVOS', "R.F.C.'s": 'ARCHIVOS', 'Horarios': 'ARCHIVOS',
        'Programacion de Examenes': 'EXAMENES', 'Relacion por Examenes': 'EXAMENES', 'Reasignacion de Examenes': 'EXAMENES',
        'Motivos (Conc. de Baja)': 'OTROS CATALOGOS', 'Instrumentos (Equip.)': 'OTROS CATALOGOS', 'Medios (Canales difusion)': 'OTROS CATALOGOS', 'Salones (Aulas e inst.)': 'OTROS CATALOGOS',
        'Impresion de Reportes': 'REPORTES'
    },

    /**
     * Verifica permisos para una sección
     * @param {string} seccion - Nombre de la sección (Archivos, Caja, etc.)
     * @returns {string} - 'N' (None), 'M' (Modify), 'C' (Consult)
     */
    getPermission: function(seccion) {
        const user = this.getCurrentUser();
        if (!user) return 'N';
        if (user.rol === 'SuperAdmin') return 'M'; 

        // 1. Buscar permiso específico para la sección (ej: "Alumnos")
        let p = user.permisos.find(item => item.seccion.toLowerCase() === seccion.toLowerCase());
        
        // 2. Si no hay permiso específico, buscar por categoría padre (ej: "Archivos")
        if (!p) {
            const parent = this.SECTION_PARENTS[seccion];
            if (parent) {
                p = user.permisos.find(item => item.seccion.toLowerCase() === parent.toLowerCase());
            }
        }

        // 3. Fallback inverso: Si pido permiso para una categoría ("Archivos"),
        // y tengo restricciones en sus hijos, quizás debamos ser precavidos.
        // Pero por ahora, el flujo principal es de hijos a padres o directos.

        if (p) return p.permiso;

        // IMPORTANTE: Si el usuario ya tiene permisos configurados pero no este, 
        // y es un empleado/jefe, podrías querer restringir.
        // Pero mantenemos 'M' por compatibilidad con el diseño original si no hay nada definido.
        return 'M';
    },

    /**
     * Refresca los permisos del usuario desde la base de datos
     */
    refreshPermissions: async function() {
        const user = this.getCurrentUser();
        if (!user || user.rol === 'SuperAdmin') return;

        try {
            const db = typeof window.waitForSupabase === 'function' 
                ? await window.waitForSupabase() 
                : (window.supabase || (window.db));
            
            if (!db) return;

            const { data: permisos, error } = await db
                .from('permisos_seguridad')
                .select('seccion, permiso')
                .eq('usuario_id', user.id);
            
            if (error) throw error;
            
            // Actualizar localStorage con los nuevos permisos
            user.permisos = permisos || [];
            localStorage.setItem('scala_session', JSON.stringify(user));
            console.log('🛡️ Permisos sincronizados con el servidor');

            // 2. Aplicar restricciones a elementos con [data-section] en la página actual
            // Esto sirve para menús y dashboards donde hay varios módulos
            document.querySelectorAll('[data-section]').forEach(el => {
                if (el.tagName === 'BODY') return; // El body se maneja en protectPage
                
                const sectionName = el.getAttribute('data-section');
                const perm = this.getPermission(sectionName);
                
                if (perm === 'N') {
                    el.style.display = 'none';
                    console.log(`🚫 Seccion "${sectionName}" oculta por falta de permisos.`);
                }
            });
        } catch (e) {
            console.warn('⚠️ Fallo al sincronizar permisos:', e.message);
        }
    },

    /**
     * Bloquea el acceso a la página si el permiso es 'N'
     */
    protectPage: async function(seccion) {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
            return;
        }

        // 1. Refrescar permisos primero para asegurar que tenemos lo último
        await this.refreshPermissions();

        const p = this.getPermission(seccion);
        if (p === 'N') {
            const msg = `Sin acceso al apartado "${seccion}" por parte del admin.`;
            if (typeof mostrarAlerta !== 'undefined') {
                await mostrarAlerta(msg);
            } else {
                alert(msg);
            }
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
        const apply = () => {
            console.log('🔒 Aplicando modo SOLO CONSULTA (JS + CSS)');
            this.isReadOnly = true;
            
            // 1. Inyectar CSS selectivo (solo para botones de acción clara)
            const style = document.createElement('style');
            style.id = 'readonly-styles';
            style.innerHTML = `
                /* Ocultar botones de guardado y eliminación por clase */
                .btn-save, button[id*="btnGuardar"], button[id*="btnSave"],
                button[id*="btnBorrar"], button[id*="btnEliminar"] {
                    display: none !important;
                }
                
                /* Deshabilitar interacción pero mantener visibilidad de consulta */
                input:disabled, select:disabled, textarea:disabled {
                    background-color: #f8fafc !important;
                    color: #475569 !important;
                    cursor: not-allowed;
                }
            `;
            document.head.appendChild(style);

            // 2. Filtrado Agresivo de Botones mediante JS
            // Enfoque "Zero-Trust": Ocultar todo lo que parezca acción y solo mostrar lo seguro
            document.querySelectorAll('button, .premium-btn, .menu-btn, .btn-action, .access-btn, .lupa-btn-access').forEach(btn => {
                const text = (btn.textContent || '').toUpperCase().trim();
                const onClick = (btn.getAttribute('onclick') || '').toUpperCase();
                const id = (btn.id || '').toLowerCase();

                // Lista de palabras clave para NAVEGACIÓN Y CONSULTA (Siempre visibles)
                const protectedActions = [
                    'TERMINAR', 'SALIR', 'VOLVER', 'REGRESAR', 'CANCELAR', 'CERRAR', 
                    'BUSCAR', 'FILTRAR', 'IMPRIMIR', 'REPORTE', 'LISTA', 'DETALLE', 'VER', 
                    'CONSULTAR', 'SIGUIENTE', 'ANTERIOR', 'PRIMERO', 'ULTIMO', 'LUPA', '🔍',
                    'COBROS', 'CAJA', 'CORTE', 'CONSULTA'
                ];

                // Lista de palabras clave para ACCIONES PROHIBIDAS (Escribir/Modificar/Borrar)
                const forbiddenActions = [
                    'GUARDAR', 'SAVE', 'ALTA', 'NUEVO', 'NUEVA', 'EDITAR', 'EDICIÓN', 'EDICION',
                    'BORRAR', 'ELIMINAR', 'BAJA', 'ADD', 'DELETE', 'REINGRESO', 'REINGRESAR',
                    'PROCESAR', 'GENERAR', 'COBRAR', 'PAGAR', 'PAGO', 'ACTUALIZAR', 'UPDATE',
                    'REGISTRAR', 'ASIGNAR', 'CAMBIAR', 'MODIFICAR'
                ];
                
                // Determinar si es una acción de navegación protegida
                const isProtected = protectedActions.some(word => 
                    text.includes(word) || 
                    onClick.includes(word) || 
                    id.includes(word.toLowerCase()) ||
                    (word === '🔍' && text === '')
                );

                // Determinar si es una acción prohibida explícita
                const isForbidden = forbiddenActions.some(word => 
                    text.includes(word) || 
                    onClick.includes(word) || 
                    id.includes(word.toLowerCase())
                );

                // Lógica de decisión:
                if (isProtected) {
                    // Si es navegación protegida, ASEGURAR visibilidad
                    btn.style.setProperty('display', '', 'important');
                    btn.disabled = false;
                    btn.style.pointerEvents = 'auto';
                    btn.style.opacity = '1';
                } else if (isForbidden || (text !== "" && !isProtected)) {
                    // Si es prohibida O es un botón con texto que no es protegido -> OCULTAR
                    btn.style.setProperty('display', 'none', 'important');
                }
            });

            // 3. Deshabilitar entradas de datos (excepto búsquedas)
            document.querySelectorAll('input, select, textarea').forEach(el => {
                const id = (el.id || '').toLowerCase();
                const placeholder = (el.placeholder || '').toLowerCase();
                const isSearch = id.includes('buscar') || id.includes('search') || placeholder.includes('buscar');
                
                if (!isSearch) {
                    el.disabled = true;
                    el.style.pointerEvents = 'none'; // Evitar cambios accidentales
                } else {
                    // Asegurar que las búsquedas funcionen
                    el.disabled = false;
                    el.style.pointerEvents = 'auto';
                    el.style.opacity = '1';
                }
            });
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                apply();
                // Persistencia: Ejecutar periódicamente para atrapar elementos dinámicos
                setInterval(apply, 1000);
            });
        } else {
            apply();
            setInterval(apply, 1000);
        }
    },

    /**
     * Aplica el filtro de organizacion_id a una consulta de Supabase
     */
    applyIsolation: function(query) {
        const user = this.getCurrentUser();
        if (!user) return query;
        
        let orgId = user.organizacion_id;
        let isSuperAdmin = user.rol === 'SuperAdmin';
        
        if (isSuperAdmin) {
            // Si el SuperAdmin ha seleccionado una organización específica para esta sesión
            const selectedOrg = sessionStorage.getItem('superadmin_org_id');
            if (selectedOrg && selectedOrg !== 'all') {
                orgId = selectedOrg;
            } else {
                return query; // Sin aislamiento para SuperAdmin normal (ve todo)
            }
        }

        // Verificación de robustez: debe ser un objeto de Supabase que permita filtros
        if (!query || (typeof query.or !== 'function' && typeof query.select !== 'function')) {
            console.warn('SessionManager: Objeto de consulta inválido o muy temprano para filtrar.', query);
            return query;
        }

        // Si es un QueryBuilder (sin select/delete/etc), no podemos aplicar .or aún
        if (typeof query.or !== 'function') {
            return query;
        }

        const globalId = '00000000-0000-0000-0000-000000000000';

        // Construir filtros de forma robusta
        let orFilter = '';
        if (orgId) {
            orFilter = `organizacion_id.eq.${orgId},organizacion_id.is.null`;
        } else {
            orFilter = `organizacion_id.is.null`;
        }

        // Determinar si la tabla debe tener acceso global (Catálogos)
        const url = query.url ? query.url.toString() : '';
        const table = url.split('/').pop().split('?')[0];

        // Tablas compartidas globalmente por todas las organizaciones
        const globalTables = [
            'tipos_movimiento', 'instrumentos', 'motivos_baja', 'medios_contacto'
        ];

        if (globalTables.includes(table)) {
            // Sin aislamiento de organización: Todos pueden ver todo
            return query;
        } else {
            // Datos propios de la organización (incluyendo salones, alumnos, etc.)
            return query.or(orFilter);
        }
    },

    /**
     * Oculta elementos que el usuario no tiene permiso de ver (N)
     */
    applyMenuRestrictions: function() {
        const user = this.getCurrentUser();
        if (!user || user.rol === 'SuperAdmin') return;

        console.log('🛡️ Aplicando restricciones de menú...');
        
        // 1. Ocultar botones/enlaces que tengan data-section
        document.querySelectorAll('[data-section]').forEach(el => {
            // Solo si el elemento no es el body (protección de página)
            if (el.tagName !== 'BODY') {
                const section = el.getAttribute('data-section');
                if (this.getPermission(section) === 'N') {
                    el.style.display = 'none';
                }
            }
        });

        // 2. Ocultar elementos específicos por texto o ID si es necesario (Fallback)
        const buttons = document.querySelectorAll('.menu-btn, .premium-btn');
        buttons.forEach(btn => {
            const text = btn.textContent.trim().toUpperCase();
            // Mapear texto de botón a sección si no tiene data-section
            // (Esto es un extra por si olvidamos poner data-section en el HTML)
            if (this.getPermission(text) === 'N') {
                btn.style.display = 'none';
            }
        });
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
(async function() {
    const seccion = document.body.getAttribute('data-section');
    
    // 1. Protección inmediata con datos en caché (localStorage)
    if (seccion) {
        const user = SessionManager.getCurrentUser();
        if (user && user.rol !== 'SuperAdmin') {
            const p = SessionManager.getPermission(seccion);
            if (p === 'N') {
                window.location.href = 'index.html'; // Redirección silenciosa inicial
                return;
            }
            if (p === 'C') {
                SessionManager.applyReadOnlyMode();
            }
        }
    }

    // 2. Ejecutar branding y restricciones de menú
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            SessionManager.loadBranding();
            SessionManager.applyMenuRestrictions();
        });
    } else {
        SessionManager.loadBranding();
        SessionManager.applyMenuRestrictions();
    }

    // 3. Validación profunda contra la base de datos (Asíncrona)
    if (seccion) {
        await SessionManager.protectPage(seccion);
    } else {
        await SessionManager.refreshPermissions();
    }
})();

window.SessionManager = SessionManager;
