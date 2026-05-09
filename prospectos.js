// Inicializar Supabase
let supabase = null;
let prospectos = [];
let currentIndex = 0;

// Esperar a que se cargue la libreria de Supabase
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM cargado, inicializando prospectos...');

    // Esperar a que Supabase esté listo
    try {
        await new Promise(r => setTimeout(r, 500));
        if (typeof waitForSupabase === 'function') {
            supabase = await waitForSupabase(10000);
            console.log('✓ Supabase conectado');
        }
    } catch (e) {
        console.error('Error conectando a Supabase:', e);
    }

    // Inicializar datos
    if (supabase) await loadCursos();
    const idProspectoInput = document.getElementById('idProspecto');
    if (idProspectoInput && supabase) {
        idProspectoInput.value = await generateProspectoId();
    }
    const fechaAtencionInput = document.getElementById('fechaAtencion');
    if (fechaAtencionInput) {
        fechaAtencionInput.value = new Date().toISOString().split('T')[0];
    }

    // Configurar event listeners
    setupEventListeners();

    console.log('Inicialización de prospectos completa');
});

// Configurar todos los event listeners
function setupEventListeners() {
    // Los botones ya tienen onclick en el HTML, no es necesario addEventListener
    // Esto evita que las funciones se ejecuten doble o haya conflictos
}

// Función terminar (disponible globalmente)
async function terminarProspectos() {
    if (await mostrarConfirm('¿Desea salir del módulo de Prospectos?')) {
        window.location.href = 'archivos.html';
    }
}

// Generar ID de prospecto
async function generateProspectoId() {
    if (!supabase) return 1001;

    try {
        const { data, error } = await supabase
            .from('prospectos')
            .select('id')
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

// Cargar cursos
async function loadCursos() {
    if (!supabase) return;

    try {
        const { data, error } = await supabase
            .from('cursos')
            .select('*')
            .order('curso', { ascending: true });

        if (error) throw error;

        const select = document.getElementById('curso');
        if (!select) return;

        select.innerHTML = '<option value=""></option>';

        if (data && data.length > 0) {
            data.forEach(curso => {
                const option = document.createElement('option');
                option.value = curso.id;
                option.textContent = curso.curso;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando cursos:', error);
    }
}

// Nuevo prospecto - Preparar formulario para captura
async function nuevoProspecto() {
    const form = document.getElementById('prospectosForm');
    if (form) {
        form.reset();
    }

    // Generar nuevo ID
    const idProspectoInput = document.getElementById('idProspecto');
    if (idProspectoInput) {
        idProspectoInput.value = await generateProspectoId();
    }

    // Establecer fecha actual
    const fechaAtencionInput = document.getElementById('fechaAtencion');
    if (fechaAtencionInput) {
        fechaAtencionInput.value = new Date().toISOString().split('T')[0];
    }

    // Togle botones
    // Toggle botones: Ocultar Nuevo, Mostrar Guardar y Cancelar
    document.getElementById('nuevoBtn').style.display = 'none';
    document.getElementById('guardarBtn').style.display = 'inline-block';
    document.getElementById('cancelarBtn').style.display = 'inline-block';
    
    // Mantener los demás visibles
    document.getElementById('buscarBtn').style.display = 'inline-block';
    document.getElementById('borrarBtn').style.display = 'inline-block';

    // Focus en nombre
    const nombreInput = document.getElementById('nombre');
    if (nombreInput) {
        nombreInput.focus();
    }
}

// Cancelar captura y refrescar
function cancelarAccion() {
    window.location.reload();
}

// Guardar prospecto
async function saveProspecto() {
    if (!supabase) {
        await mostrarAlerta('Error: Base de datos no conectada');
        return;
    }
    
    const nombre = document.getElementById('nombre').value;
    if (!nombre) {
        await mostrarAlerta('Ingrese el nombre del prospecto');
        return;
    }

    const prospectoData = {
        id: document.getElementById('idProspecto').value,
        fecha_atencion: document.getElementById('fechaAtencion').value,
        nombre: nombre,
        apellidos: document.getElementById('apellidos').value,
        edad: parseInt(document.getElementById('edad').value) || null,
        telefono: document.getElementById('telefono').value,
        direccion: document.getElementById('direccion').value,
        ciudad: document.getElementById('ciudad').value,
        codigo_postal: document.getElementById('codigoPostal').value,
        curso_id: document.getElementById('curso').value || null,
        medio_entero: document.getElementById('medioEntero').value,
        recomienda: document.getElementById('recomienda').value,
        dia_preferente1: document.getElementById('diaPreferente1').value,
        hora_preferente1: document.getElementById('horaPreferente1').value,
        dia_preferente2: document.getElementById('diaPreferente2').value,
        hora_preferente2: document.getElementById('horaPreferente2').value,
        se_inscribio: document.getElementById('seInscribio').value,
        sigue_interesado: document.getElementById('sigueInteresado').value,
        nota: document.getElementById('nota').value,
        atendio: document.getElementById('atendio').value
    };

    try {
        const { error } = await supabase
            .from('prospectos')
            .upsert([prospectoData]); // Usar upsert por si acaso ya existe (edición futura)

        if (error) throw error;

        await mostrarAlerta('Prospecto guardado correctamente');
        window.location.reload();
    } catch (error) {
        console.error('Error guardando prospecto:', error);
        await mostrarAlerta('Error al guardar el prospecto: ' + error.message);
    }
}

// Buscar prospecto (Abrir listado)
async function buscarProspecto() {
    if (!supabase) return;
    
    // Abrir el modal
    document.getElementById('modalResultadosProspecto').style.display = 'flex';
    document.getElementById('inputBuscarProspectoModal').focus();
    
    // Cargar todos los prospectos inicialmente (o los más recientes)
    await ejecutarFiltroProspectos();
}

// Filtrar prospectos en tiempo real
async function ejecutarFiltroProspectos() {
    if (!supabase) return;

    const termino = document.getElementById('inputBuscarProspectoModal').value.trim();
    const tbody = document.getElementById('bodyResultadosProspecto');
    const infoConteo = document.getElementById('infoConteoProspectos');

    try {
        let query = supabase
            .from('prospectos')
            .select('*')
            .order('fecha_atencion', { ascending: false })
            .limit(100);

        if (termino) {
            query = query.or(`nombre.ilike.%${termino}%,apellidos.ilike.%${termino}%,id.cast.text.ilike.%${termino}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        tbody.innerHTML = '';
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">No se encontraron prospectos</td></tr>';
            infoConteo.textContent = '0 registros encontrados';
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
            const fecha = p.fecha_atencion || 'N/A';
            const telefono = p.telefono || 'Sin teléfono';

            tr.innerHTML = `
                <td style="text-align: center; font-weight: bold; color: #738fbd;">${p.id}</td>
                <td style="font-weight: 500;">${nombreCompleto}</td>
                <td>${telefono}</td>
                <td style="text-align: center; color: #64748b;">${fecha}</td>
            `;
            tbody.appendChild(tr);
        });

        infoConteo.textContent = `Mostrando ${data.length} prospectos`;

    } catch (error) {
        console.error('Error filtrando prospectos:', error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Error al cargar datos</td></tr>';
    }
}

// Cargar datos en el formulario
function cargarDatosProspecto(data) {
    if (!data) return;

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

    // Si estaba en modo "Nuevo", restaurar botones
    document.getElementById('nuevoBtn').style.display = 'inline-block';
    document.getElementById('guardarBtn').style.display = 'none';
    document.getElementById('cancelarBtn').style.display = 'none';
}

function cerrarModalResultadosProspecto() {
    document.getElementById('modalResultadosProspecto').style.display = 'none';
}

// Borrar prospecto
async function deleteProspecto() {
    if (!supabase) return;
    
    const id = document.getElementById('idProspecto').value;
    if (!id) {
        await mostrarAlerta('Seleccione un prospecto primero (busque uno)');
        return;
    }

    if (!await mostrarConfirm(`¿Está seguro de eliminar al prospecto ID: ${id}?`)) {
        return;
    }

    try {
        const { error } = await supabase
            .from('prospectos')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await mostrarAlerta('Prospecto eliminado correctamente');
        window.location.reload();
    } catch (error) {
        console.error('Error eliminando prospecto:', error);
        await mostrarAlerta('Error al eliminar el prospecto: ' + error.message);
    }
}
