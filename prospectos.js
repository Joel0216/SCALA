// =====================================================
// MÓDULO DE PROSPECTOS - SCALA
// =====================================================

let db = null;
let g_prospectosCache = [];
let g_prospectoSeleccionado = null;

// Variables para paginación en búsqueda
let g_paginaActualProspectos = 1;
let g_totalPaginasProspectos = 1;
let g_totalResultadosProspectos = 0;
let g_terminoBusquedaProspectos = '';
let g_debounceTimerProspectos = null;
const G_LIMITE_PROSPECTOS = 50;

// =====================================================
// INICIALIZACIÓN
// =====================================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando módulo de prospectos...');

    try {
        if (typeof waitForSupabase === 'function') {
            db = await waitForSupabase(10000);
        } else {
            db = window.supabaseClient || window.supabase;
        }

        if (db) {
            console.log('✓ Supabase conectado');
            await loadCursos();
            await resetState(); // Iniciar en modo consulta
        } else {
            console.error('❌ Supabase NO disponible');
        }
    } catch (e) {
        console.error('Error durante la inicialización:', e);
    }

    if (typeof habilitarInputs === 'function') {
        habilitarInputs();
    }
    
    // Reloj
    setInterval(actualizarReloj, 1000);
    actualizarReloj();
});

function actualizarReloj() {
    const el = document.getElementById('datetime');
    if (el) {
        const ahora = new Date();
        el.textContent = ahora.toLocaleDateString() + ' ' + ahora.toLocaleTimeString();
    }
}

// =====================================================
// FUNCIONES DE CARGA DE DATOS
// =====================================================

// Generar ID de prospecto (Basado en el máximo existente + 1)
async function generateProspectoId() {
    if (!db) return 1001;

    try {
        const { data, error } = await SessionManager.applyIsolation(db.from('prospectos').select('id'))
            .order('id', { ascending: false })
            .limit(1);

        if (error) throw error;

        const lastId = data && data.length > 0 ? parseInt(data[0].id) : 1000;
        return lastId + 1;
    } catch (error) {
        console.error('Error generando ID:', error);
        return 1001;
    }
}

// Cargar lista de cursos para el select (solo de la organización actual)
async function loadCursos() {
    if (!db) return;

    try {
        const currentUser = SessionManager.getCurrentUser();
        const orgId = currentUser?.organizacion_id;
        const isSuperAdmin = currentUser?.rol === 'SuperAdmin';

        let query;
        if (!isSuperAdmin && orgId) {
            // Filtro estricto: solo cursos de esta organización
            query = db.from('cursos').select('id, curso').eq('organizacion_id', orgId);
        } else {
            // SuperAdmin: ver todos
            query = SessionManager.applyIsolation(db.from('cursos').select('id, curso'));
        }

        const { data, error } = await query.order('curso', { ascending: true });

        if (error) throw error;

        const select = document.getElementById('curso');
        if (!select) return;

        select.innerHTML = '<option value="">-- Seleccione un curso --</option>';

        if (data && data.length > 0) {
            data.forEach(c => {
                const option = document.createElement('option');
                option.value = c.id;
                option.textContent = c.curso;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando cursos:', error);
    }
}

// =====================================================
// ACCIONES DEL FORMULARIO
// =====================================================

async function resetState() {
    const form = document.getElementById('prospectosForm');
    if (form) form.reset();

    // Toggle botones modo BÚSQUEDA / INICIO
    document.getElementById('nuevoBtn').style.display = 'inline-block';
    document.getElementById('guardarBtn').style.display = 'none';
    document.getElementById('cancelarBtn').style.display = 'none';
    document.getElementById('buscarBtn').style.display = 'inline-block';
    document.getElementById('borrarBtn').style.display = 'none';
    
    // Deshabilitar inputs
    toggleFormInputs(true);
    
    g_prospectoSeleccionado = null;
}

function toggleFormInputs(disabled) {
    const form = document.getElementById('prospectosForm');
    if (!form) return;
    const inputs = form.querySelectorAll('input:not([readonly]), select, textarea');
    inputs.forEach(input => {
        input.disabled = disabled;
    });
}

async function nuevoProspecto() {
    const form = document.getElementById('prospectosForm');
    if (form) form.reset();

    // Habilitar inputs
    toggleFormInputs(false);

    // ID y Fecha
    const idProspectoInput = document.getElementById('idProspecto');
    if (idProspectoInput) idProspectoInput.value = await generateProspectoId();

    const fechaAtencionInput = document.getElementById('fechaAtencion');
    if (fechaAtencionInput) fechaAtencionInput.value = new Date().toISOString().split('T')[0];

    // Toggle botones modo EDICIÓN
    document.getElementById('nuevoBtn').style.display = 'none';
    document.getElementById('guardarBtn').style.display = 'inline-block';
    document.getElementById('cancelarBtn').style.display = 'inline-block';
    document.getElementById('buscarBtn').style.display = 'none';
    document.getElementById('borrarBtn').style.display = 'none';

    g_prospectoSeleccionado = null;
    
    const nombreInput = document.getElementById('nombre');
    if (nombreInput) nombreInput.focus();
}

function cancelarAccion() {
    if (g_prospectoSeleccionado) {
        // Recargar los datos originales y mantener modo edición
        cargarDatosProspecto(g_prospectoSeleccionado);
    } else {
        // Si no hay prospecto seleccionado, volver al estado inicial
        resetState();
    }
}

async function terminarProspectos() {
    if (await mostrarConfirm('¿Desea salir del módulo de Prospectos?')) {
        window.location.href = 'archivos.html';
    }
}

// Guardar prospecto (Insert o Update)
async function saveProspecto() {
    if (!db) {
        await mostrarAlerta('Error: Base de datos no conectada');
        return;
    }

    // =====================================================
    // VALIDACIÓN DE CAMPOS OBLIGATORIOS
    // =====================================================
    const nombre = document.getElementById('nombre').value.trim();
    const apellidos = document.getElementById('apellidos').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const fechaAtencion = document.getElementById('fechaAtencion').value;
    const cursoId = document.getElementById('curso').value;

    // --- Información del Prospecto (sección 1) ---
    if (!nombre) {
        await mostrarAlerta('⚠️ Campo obligatorio (Información del Prospecto):\nIngrese el NOMBRE del prospecto.');
        document.getElementById('nombre').focus();
        return;
    }
    if (!apellidos) {
        await mostrarAlerta('⚠️ Campo obligatorio (Información del Prospecto):\nIngrese los APELLIDOS del prospecto.');
        document.getElementById('apellidos').focus();
        return;
    }
    if (!telefono) {
        await mostrarAlerta('⚠️ Campo obligatorio (Información del Prospecto):\nIngrese el TELÉFONO del prospecto.');
        document.getElementById('telefono').focus();
        return;
    }
    if (!fechaAtencion) {
        await mostrarAlerta('⚠️ Campo obligatorio (Información del Prospecto):\nIngrese la FECHA DE ATENCIÓN.');
        document.getElementById('fechaAtencion').focus();
        return;
    }

    // --- Interés y Captación (sección 2) ---
    if (!cursoId) {
        await mostrarAlerta('⚠️ Campo obligatorio (Interés y Captación):\nSeleccione el CURSO DE INTERÉS del prospecto.');
        document.getElementById('curso').focus();
        return;
    }

    const idProspecto = parseInt(document.getElementById('idProspecto').value);
    const prospectoData = {
        fecha_atencion: fechaAtencion,
        nombre: nombre,
        apellidos: apellidos,
        edad: parseInt(document.getElementById('edad').value) || null,
        telefono: telefono,
        direccion: document.getElementById('direccion').value.trim(),
        ciudad: document.getElementById('ciudad').value.trim(),
        codigo_postal: document.getElementById('codigoPostal').value.trim(),
        curso_id: cursoId,
        medio_entero: document.getElementById('medioEntero').value,
        recomienda: document.getElementById('recomienda').value.trim(),
        dia_preferente1: document.getElementById('diaPreferente1').value,
        hora_preferente1: document.getElementById('horaPreferente1').value,
        dia_preferente2: document.getElementById('diaPreferente2').value,
        hora_preferente2: document.getElementById('horaPreferente2').value,
        se_inscribio: document.getElementById('seInscribio').value,
        sigue_interesado: document.getElementById('sigueInteresado').value,
        nota: document.getElementById('nota').value.trim(),
        atendio: document.getElementById('atendio').value.trim(),
        organizacion_id: SessionManager.getCurrentUser()?.organizacion_id
    };

    try {
        let savedData;

        if (g_prospectoSeleccionado) {
            // EDICIÓN: actualizar registro existente
            const { data, error } = await db.from('prospectos')
                .update(prospectoData)
                .eq('id', g_prospectoSeleccionado.id)
                .select()
                .single();
            if (error) throw error;
            savedData = data;
            await mostrarAlerta(`✓ Prospecto "${nombre} ${apellidos}" actualizado correctamente.`);
        } else {
            // NUEVO: insertar con el ID generado
            const { data, error } = await db.from('prospectos')
                .insert([{ id: idProspecto, ...prospectoData }])
                .select()
                .single();
            if (error) throw error;
            savedData = data;
            await mostrarAlerta(`✓ Prospecto "${nombre} ${apellidos}" registrado con ID ${idProspecto}.`);
        }

        // Después de guardar, cargar los datos guardados en el form (sin recargar la página)
        if (savedData) {
            cargarDatosProspecto(savedData);
        }

    } catch (err) {
        console.error('Error guardando prospecto:', err);
        await mostrarAlerta('❌ Error al guardar: ' + err.message);
    }
}

async function deleteProspecto() {
    if (!db || !g_prospectoSeleccionado) return;
    
    const id = g_prospectoSeleccionado.id;
    if (!await mostrarConfirm(`¿Está seguro de eliminar al prospecto ID: ${id}?`)) {
        return;
    }

    try {
        const { error } = await db.from('prospectos').delete().eq('id', id);

        if (error) throw error;

        await mostrarAlerta('✓ Prospecto eliminado correctamente');
        await resetState();
    } catch (error) {
        console.error('Error eliminando prospecto:', error);
        await mostrarAlerta('❌ Error al eliminar: ' + error.message);
    }
}

// =====================================================
// BÚSQUEDA Y RESULTADOS (ESTILO ARTÍCULOS - TIEMPO REAL)
// =====================================================

/**
 * Abre el modal unificado de búsqueda de prospectos.
 * Carga todos los registros inmediatamente y permite filtrar en tiempo real.
 */
function buscarProspecto() {
    const modal = document.getElementById('modalBusquedaProspecto');
    if (!modal) return;
    modal.style.display = 'flex';

    const input = document.getElementById('inputBusquedaProspecto');
    if (input) {
        input.value = '';
        // Búsqueda en tiempo real (como Artículos)
        input.oninput = function() {
            clearTimeout(g_debounceTimerProspectos);
            g_debounceTimerProspectos = setTimeout(() => {
                g_terminoBusquedaProspectos = this.value.trim().toUpperCase();
                g_paginaActualProspectos = 1;
                cargarResultadosBusquedaProspecto();
            }, 300);
        };
        input.onkeydown = function(e) {
            if (e.key === 'Enter') {
                clearTimeout(g_debounceTimerProspectos);
                g_terminoBusquedaProspectos = this.value.trim().toUpperCase();
                g_paginaActualProspectos = 1;
                cargarResultadosBusquedaProspecto();
            }
        };
        setTimeout(() => input.focus(), 100);
    }

    // Mostrar todos los prospectos al abrir (sin término de búsqueda)
    g_terminoBusquedaProspectos = '';
    g_paginaActualProspectos = 1;
    cargarResultadosBusquedaProspecto();
}

function cerrarModalBusquedaProspecto() {
    const modal = document.getElementById('modalBusquedaProspecto');
    if (modal) modal.style.display = 'none';
}

// Alias para compatibilidad con botón cerrar dentro del modal
function cerrarModalResultadosProspecto() {
    cerrarModalBusquedaProspecto();
}

async function cargarResultadosBusquedaProspecto() {
    const termino = g_terminoBusquedaProspectos;
    const pagina = g_paginaActualProspectos;
    const desde = (pagina - 1) * G_LIMITE_PROSPECTOS;

    const tbody = document.getElementById('bodyResultadosProspecto');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">Buscando...</td></tr>';

    // Actualizar contador de resultados
    const contadorEl = document.getElementById('contadorResultadosProspectos');

    if (!db) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Error: No hay conexión a la base de datos</td></tr>';
        return;
    }

    try {
        let query = SessionManager.applyIsolation(db.from('prospectos').select('*', { count: 'exact' }));

        if (termino) {
            // Búsqueda inteligente: si es número busca por ID, si no por nombre/apellidos
            if (!isNaN(termino) && termino.length > 0 && !termino.includes(' ')) {
                query = query.eq('id', parseInt(termino));
            } else {
                query = query.or(`nombre.ilike.%${termino}%,apellidos.ilike.%${termino}%,telefono.ilike.%${termino}%`);
            }
        }

        const { data, error, count } = await query
            .order('fecha_atencion', { ascending: false })
            .range(desde, desde + G_LIMITE_PROSPECTOS - 1);

        if (error) throw error;

        g_totalResultadosProspectos = count || 0;
        g_totalPaginasProspectos = Math.max(1, Math.ceil(g_totalResultadosProspectos / G_LIMITE_PROSPECTOS));

        // Actualizar contador
        if (contadorEl) {
            contadorEl.textContent = termino
                ? `${g_totalResultadosProspectos} resultado(s) para "${termino}"`
                : `${g_totalResultadosProspectos} prospectos registrados`;
        }

        tbody.innerHTML = '';
        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 20px; color:#9ca3af;">
                ${termino ? '🔍 No se encontraron prospectos con ese criterio' : 'Sin prospectos registrados'}
            </td></tr>`;
            actualizarPaginacionProspectos();
            return;
        }

        data.forEach(p => {
            const tr = document.createElement('tr');
            tr.style.cursor = 'pointer';
            tr.onclick = () => {
                cargarDatosProspecto(p);
                cerrarModalBusquedaProspecto();
            };
            tr.onmouseover = function() { this.style.backgroundColor = '#000080'; this.style.color = 'white'; };
            tr.onmouseout = function() { this.style.backgroundColor = ''; this.style.color = ''; };

            const nombreCompleto = `${p.nombre || ''} ${p.apellidos || ''}`.trim();
            const fecha = p.fecha_atencion ? new Date(p.fecha_atencion + 'T00:00:00').toLocaleDateString('es-MX') : '—';
            const telefono = p.telefono || '—';
            const inscrBadge = p.se_inscribio === 'Si'
                ? '<span style="background:#10b981;color:white;font-size:9px;padding:2px 6px;border-radius:10px;">INSCRITO</span>'
                : '';

            tr.innerHTML = `
                <td style="text-align:center; font-weight:bold; color:#1e40af; padding:8px 6px;">${p.id}</td>
                <td style="font-weight:500; padding:8px 6px;">${nombreCompleto} ${inscrBadge}</td>
                <td style="padding:8px 6px;">${telefono}</td>
                <td style="text-align:center; color:#6b7280; padding:8px 6px; font-size:0.85rem;">${fecha}</td>
            `;
            tbody.appendChild(tr);
        });

        actualizarPaginacionProspectos();
    } catch (e) {
        console.error('Error buscando prospectos:', e);
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red; padding: 20px;">Error al cargar datos: ${e.message}</td></tr>`;
    }
}

function actualizarPaginacionProspectos() {
    const cont = document.getElementById('paginacionControlesProspectos');
    const info = document.getElementById('infoPaginaProspectos');

    if (!cont) return;

    if (g_totalPaginasProspectos <= 1) {
        cont.style.display = 'none';
        return;
    }

    cont.style.display = 'flex';
    if (info) info.textContent = `Página ${g_paginaActualProspectos} de ${g_totalPaginasProspectos}`;

    // Actualizar estado de botones si existen
    const btnPrev = document.getElementById('btnAnteriorProspectos');
    const btnNext = document.getElementById('btnSiguienteProspectos');
    if (btnPrev) btnPrev.disabled = g_paginaActualProspectos === 1;
    if (btnNext) btnNext.disabled = g_paginaActualProspectos === g_totalPaginasProspectos;
}

function irPrimeraPaginaProspectos() {
    if (g_paginaActualProspectos > 1) {
        g_paginaActualProspectos = 1;
        cargarResultadosBusquedaProspecto();
    }
}

function irAnteriorPaginaProspectos() {
    if (g_paginaActualProspectos > 1) {
        g_paginaActualProspectos--;
        cargarResultadosBusquedaProspecto();
    }
}

function irSiguientePaginaProspectos() {
    if (g_paginaActualProspectos < g_totalPaginasProspectos) {
        g_paginaActualProspectos++;
        cargarResultadosBusquedaProspecto();
    }
}

function irUltimaPaginaProspectos() {
    if (g_paginaActualProspectos < g_totalPaginasProspectos) {
        g_paginaActualProspectos = g_totalPaginasProspectos;
        cargarResultadosBusquedaProspecto();
    }
}

// =====================================================
// CARGA DE DATOS EN FORMULARIO
// =====================================================

function cargarDatosProspecto(data) {
    if (!data) return;
    g_prospectoSeleccionado = data;

    document.getElementById('idProspecto').value = data.id;
    document.getElementById('fechaAtencion').value = data.fecha_atencion || '';
    document.getElementById('nombre').value = data.nombre || '';
    document.getElementById('apellidos').value = data.apellidos || '';
    document.getElementById('edad').value = data.edad || '';
    document.getElementById('telefono').value = data.telefono || '';
    document.getElementById('direccion').value = data.direccion || '';
    document.getElementById('ciudad').value = data.ciudad || 'Mérida';
    document.getElementById('codigoPostal').value = data.codigo_postal || '';

    // Asignar curso: si el select ya tiene opciones, asignar directo; sino esperar carga
    const cursoSelect = document.getElementById('curso');
    if (cursoSelect) {
        if (cursoSelect.options.length > 1) {
            cursoSelect.value = data.curso_id || '';
        } else {
            // Esperar a que carguen los cursos y luego asignar
            loadCursos().then(() => {
                cursoSelect.value = data.curso_id || '';
            });
        }
    }

    document.getElementById('medioEntero').value = data.medio_entero || 'RECOMENDACION';
    document.getElementById('recomienda').value = data.recomienda || '';
    document.getElementById('diaPreferente1').value = data.dia_preferente1 || '';
    document.getElementById('horaPreferente1').value = data.hora_preferente1 || '';
    document.getElementById('diaPreferente2').value = data.dia_preferente2 || '';
    document.getElementById('horaPreferente2').value = data.hora_preferente2 || '';
    document.getElementById('seInscribio').value = data.se_inscribio || 'No';
    document.getElementById('sigueInteresado').value = data.sigue_interesado || 'Si';
    document.getElementById('nota').value = data.nota || '';
    document.getElementById('atendio').value = data.atendio || '';

    // Deshabilitar inputs para que sea solo lectura al buscar
    toggleFormInputs(true);

    // Estado de botones: modo BÚSQUEDA (solo ver, no editar directamente)
    document.getElementById('nuevoBtn').style.display = 'inline-block';
    document.getElementById('guardarBtn').style.display = 'none';
    document.getElementById('cancelarBtn').style.display = 'none';
    document.getElementById('buscarBtn').style.display = 'inline-block';
    document.getElementById('borrarBtn').style.display = 'inline-block';
}
