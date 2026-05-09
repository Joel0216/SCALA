// Inicializar Supabase
let supabase = null;
let cursos = [];
let maestros = [];
let salones = [];

// Esperar a que se cargue el DOM
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM cargado, inicializando alta de grupos...');

    try {
        if (typeof waitForSupabase === 'function') {
            supabase = await waitForSupabase(10000);
            console.log('✓ Supabase conectado');
        } else if (typeof getSupabase === 'function') {
            supabase = getSupabase();
        }
    } catch (e) {
        console.error('Error conectando a Supabase:', e);
    }

    // Actualizar fecha/hora
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // Cargar datos
    await cargarCursos();
    await cargarMaestros();
    await cargarSalones();

    // Validaciones de Cupo
    const cupoInput = document.getElementById('cupo');
    if (cupoInput) {
        cupoInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }

    // Setup event listeners
    setupEventListeners();

    console.log('Inicialización completa');
});

// Actualizar fecha y hora
function updateDateTime() {
    const now = new Date();
    const formatted = now.toLocaleString('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
    const el = document.getElementById('datetime');
    if (el) el.textContent = formatted;
}

// Setup event listeners
function setupEventListeners() {
    // Actualizar clave al cambiar campos críticos
    const fields = ['cursoId', 'maestroId', 'dia', 'horaEntrada'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', generarClave);
    });

    // Mostrar información del salón
    const salon = document.getElementById('salon');
    if (salon) {
        salon.addEventListener('change', function () {
            mostrarInfoSalon(this.value);
        });
    }

    // Botones
    document.getElementById('nuevoBtn')?.addEventListener('click', guardarGrupo);
    document.getElementById('cancelarBtn')?.addEventListener('click', limpiarFormulario);
    document.getElementById('terminarBtn')?.addEventListener('click', () => {
        if (confirm('¿Desea salir?')) window.location.href = 'grupos.html';
    });
}

// Cargar catálogos
async function cargarCursos() {
    try {
        if (!supabase) {
            console.warn('Supabase no disponible en cargarCursos');
            return;
        }

        console.log('Cargando cursos para el select...');
        const { data, error } = await supabase.from('cursos').select('*').order('curso');
        if (error) throw error;
        cursos = data || [];

        const select = document.getElementById('cursoId');
        if (select) {
            // Mantener la opción por defecto
            select.innerHTML = '<option value="">-- Seleccione un curso --</option>';
            cursos.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.curso || c.nombre;
                select.appendChild(opt);
            });
        }
        console.log(`✓ ${cursos.length} cursos cargados`);
    } catch (e) {
        console.error('Error cargando cursos:', e);
    }
}

async function cargarMaestros() {
    try {
        if (!supabase) {
            console.warn('Supabase no disponible en cargarMaestros');
            return;
        }

        console.log('Cargando maestros para el select...');
        const { data, error } = await supabase.from('maestros').select('*').eq('activo', true).order('nombre');
        if (error) throw error;
        maestros = data || [];

        const select = document.getElementById('maestroId');
        if (select) {
            select.innerHTML = '<option value="">-- Seleccione un maestro --</option>';
            maestros.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.id;
                opt.textContent = m.nombre;
                select.appendChild(opt);
            });
        }
        console.log(`✓ ${maestros.length} maestros cargados`);
    } catch (e) {
        console.error('Error cargando maestros:', e);
    }
}

async function cargarSalones() {
    try {
        if (!supabase) {
            console.warn('Supabase no disponible en cargarSalones');
            return;
        }

        const { data, error } = await supabase.from('salones').select('*').order('numero');
        if (error) throw error;
        salones = data || [];
        const select = document.getElementById('salon');
        if (select) {
            select.innerHTML = '<option value="">-- Seleccione --</option>';
            salones.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.numero;
                opt.textContent = `${s.numero} (Cupo: ${s.cupo})`;
                select.appendChild(opt);
            });
        }
        console.log(`✓ ${salones.length} salones cargados`);
    } catch (e) {
        console.error('Error cargando salones:', e);
    }
}

// Generación de Clave (ABCMLGLU17 - 3 letras curso, 3 letras maestro, 2 letras día, 2 dígitos hora)
function generarClave() {
    const cursoId = document.getElementById('cursoId')?.value;
    const maestroId = document.getElementById('maestroId')?.value;
    const dia = document.getElementById('dia')?.value;
    const horaEntrada = document.getElementById('horaEntrada')?.value;

    console.log('Generando clave con:', { cursoId, maestroId, dia, horaEntrada });

    if (!cursoId || !maestroId || !dia || !horaEntrada) {
        if (document.getElementById('clave')) document.getElementById('clave').value = '';
        return;
    }

    const curso = (cursos || []).find(c => c.id == cursoId);
    let codCurso = 'XXX';
    if (curso) {
        codCurso = (curso.clave || curso.curso || 'XXX').substring(0, 3).toUpperCase();
    }
    
    const maestro = (maestros || []).find(m => m.id == maestroId);
    let iniciales = 'XXX';
    if (maestro) {
        const partes = maestro.nombre.toUpperCase().trim().split(/\s+/);
        if (partes.length >= 2) {
            iniciales = partes.map(p => p[0]).join('').substring(0, 3);
        } else {
            iniciales = maestro.nombre.substring(0, 3).toUpperCase();
        }
    }
    iniciales = iniciales.padEnd(3, 'X').substring(0, 3).toUpperCase();

    const codDia = dia.substring(0, 2).toUpperCase();

    let hora = (horaEntrada || '').split(':')[0] || '00';
    if (hora.length < 2) hora = hora.padStart(2, '0');

    const nuevaClave = `${codCurso}${iniciales}${codDia}${hora}`;
    console.log('Clave generada:', nuevaClave);
    
    const claveInput = document.getElementById('clave');
    if (claveInput) claveInput.value = nuevaClave;
}

function mostrarInfoSalon(salonId) {
    const info = document.getElementById('salonInfo');
    if (!info) return;
    const s = salones.find(x => x.numero == salonId);
    info.textContent = s ? `Instrumentos: ${s.instrumentos || 'Ninguno'}. Cupo: ${s.cupo}` : '';
}

async function guardarGrupo() {
    const clave = document.getElementById('clave').value;
    if (!clave) {
        alert('Complete los campos para generar la clave.');
        return;
    }

    if (!supabase) {
        alert('Error: No hay conexión a Supabase');
        return;
    }

    const cupo = parseInt(document.getElementById('cupo').value) || 0;
    if (cupo < 0) return alert('El cupo no puede ser negativo.');

    const grupoData = {
        clave: clave,
        curso_id: document.getElementById('cursoId').value,
        maestro_id: document.getElementById('maestroId').value,
        dia: document.getElementById('dia').value,
        hora_entrada: document.getElementById('horaEntrada').value,
        hora_salida: document.getElementById('horaSalida').value,
        salon_id: document.getElementById('salon').value,
        cupo: cupo,
        fecha_inicio: document.getElementById('inicio').value,
        leccion: document.getElementById('leccion').value || '',
        fecha_leccion: document.getElementById('fechaLeccion').value,
        tipo_pago_maestro: document.getElementById('tipo_pago_maestro').value,
        activo: true
    };

    try {
        console.log('Guardando grupo:', grupoData);
        const { data, error } = await supabase.from('grupos').insert([grupoData]);
        if (error) throw error;
        alert('Grupo guardado exitosamente.');
        limpiarFormulario();
    } catch (e) {
        console.error('Error al guardar grupo:', e);
        alert('Error: ' + (e.message || e));
    }
}

function limpiarFormulario() {
    document.getElementById('altaForm').reset();
    document.getElementById('clave').value = '';
    const info = document.getElementById('salonInfo');
    if (info) info.textContent = '';
}
