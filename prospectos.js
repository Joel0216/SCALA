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

// Cargar lista de cursos para el select
async function loadCursos() {
    if (!db) return;

    try {
        const { data, error } = await SessionManager.applyIsolation(db.from('cursos').select('id, curso'))
            .order('curso', { ascending: true });

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
        cargarDatosProspecto(g_prospectoSeleccionado);
    } else {
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
    
    const nombre = document.getElementById('nombre').value.trim();
    if (!nombre) {
        await mostrarAlerta('Ingrese el nombre del prospecto');
        return;
    }

    const prospectoData = {
        id: parseInt(document.getElementById('idProspecto').value),
        fecha_atencion: document.getElementById('fechaAtencion').value,
        nombre: nombre,
        apellidos: document.getElementById('apellidos').value.trim(),
        edad: parseInt(document.getElementById('edad').value) || null,
        telefono: document.getElementById('telefono').value.trim(),
        direccion: document.getElementById('direccion').value.trim(),
        ciudad: document.getElementById('ciudad').value.trim(),
        codigo_postal: document.getElementById('codigoPostal').value.trim(),
        curso_id: document.getElementById('curso').value || null,
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
        // Usamos upsert para manejar tanto creación como edición
        const { error } = await db.from('prospectos').upsert([prospectoData]);

        if (error) throw error;

        await mostrarAlerta('✓ Prospecto guardado correctamente');
        
        // Si era nuevo, recargar todo. Si era edición, simplemente refrescar estado.
        window.location.reload();
    } catch (error) {
        console.error('Error guardando prospecto:', error);
        await mostrarAlerta('❌ Error al guardar: ' + error.message);
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
// BÚSQUEDA Y RESULTADOS (ESTILO ALUMNOS)
// =====================================================

function buscarProspecto() {
    document.getElementById('modalBusquedaProspecto').style.display = 'flex';
    document.getElementById('inputBusquedaProspecto').value = '';
    setTimeout(() => document.getElementById('inputBusquedaProspecto').focus(), 100);
}

function cerrarModalBusquedaProspecto() {
    document.getElementById('modalBusquedaProspecto').style.display = 'none';
}

function cerrarModalResultadosProspecto() {
    document.getElementById('modalResultadosProspecto').style.display = 'none';
}

async function ejecutarBusquedaProspecto() {
    const termino = document.getElementById('inputBusquedaProspecto').value.trim().toUpperCase();

    if (!termino) {
        await mostrarAlerta('Ingrese un nombre, apellidos o ID para buscar');
        return;
    }

    cerrarModalBusquedaProspecto();

    g_terminoBusquedaProspectos = termino;
    g_paginaActualProspectos = 1;

    await cargarResultadosBusquedaProspecto();
}

async function cargarResultadosBusquedaProspecto() {
    const termino = g_terminoBusquedaProspectos;
    const pagina = g_paginaActualProspectos;
    const limite = 50;
    const desde = (pagina - 1) * limite;

    const tbody = document.getElementById('bodyResultadosProspecto');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">Buscando...</td></tr>';
    document.getElementById('modalResultadosProspecto').style.display = 'flex';

    if (!db) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Error: No hay conexión</td></tr>';
        return;
    }

    try {
        let query = SessionManager.applyIsolation(db.from('prospectos').select('*', { count: 'exact' }));
        
        // Búsqueda inteligente: si es número busca por ID, si no por nombre/apellidos
        if (!isNaN(termino) && termino.length > 0 && !termino.includes(' ')) {
            query = query.eq('id', parseInt(termino));
        } else {
            query = query.or(`nombre.ilike.%${termino}%,apellidos.ilike.%${termino}%`);
        }

        const { data, error, count } = await query
            .order('fecha_atencion', { ascending: false })
            .range(desde, desde + limite - 1);

        if (error) throw error;

        g_totalResultadosProspectos = count || 0;
        g_totalPaginasProspectos = Math.ceil(g_totalResultadosProspectos / limite);

        tbody.innerHTML = '';
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">No se encontraron prospectos</td></tr>';
            actualizarPaginacionProspectos();
            return;
        }

        data.forEach(p => {
            const tr = document.createElement('tr');
            tr.style.cursor = 'pointer';
            tr.onclick = () => {
                cargarDatosProspecto(p);
                cerrarModalResultadosProspecto();
            };

            const nombreCompleto = `${p.nombre || ''} ${p.apellidos || ''}`.trim();
            const fecha = p.fecha_atencion || '—';
            const telefono = p.telefono || '—';

            tr.innerHTML = `
                <td style="text-align: center; font-weight: bold; color: var(--primary);">${p.id}</td>
                <td style="font-weight: 500;">${nombreCompleto}</td>
                <td>${telefono}</td>
                <td style="text-align: center; color: var(--text-muted);">${fecha}</td>
            `;
            tbody.appendChild(tr);
        });

        actualizarPaginacionProspectos();
    } catch (e) {
        console.error('Error buscando prospectos:', e);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red; padding: 20px;">Error al cargar datos</td></tr>';
    }
}

function actualizarPaginacionProspectos() {
    const cont = document.getElementById('paginacionControlesProspectos');
    const info = document.getElementById('infoPaginaProspectos');

    if (g_totalPaginasProspectos <= 1) {
        cont.style.display = 'none';
        return;
    }

    cont.style.display = 'flex';
    info.textContent = `Página ${g_paginaActualProspectos} de ${g_totalPaginasProspectos}`;
}

function irPrimeraPaginaProspectos() {
    if (g_paginaActualProspectos > 1) {
        g_paginaActualProspectos = 1;
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
    document.getElementById('curso').value = data.curso_id || '';
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

    // Habilitar inputs para edición
    toggleFormInputs(false);

    // Estado de botones para edición
    document.getElementById('nuevoBtn').style.display = 'inline-block';
    document.getElementById('guardarBtn').style.display = 'inline-block';
    document.getElementById('cancelarBtn').style.display = 'inline-block';
    document.getElementById('buscarBtn').style.display = 'inline-block';
    document.getElementById('borrarBtn').style.display = 'inline-block';
}
