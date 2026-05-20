// grupos-alta.js - Alta de Grupos con aislamiento multi-tenant
let supabase = null;
let cursos = [];
let maestros = [];
let salones = [];
let g_guardandoGrupo = false; // Previene doble submit

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

    updateDateTime();
    setInterval(updateDateTime, 1000);

    await cargarCursos();
    await cargarMaestros();
    await cargarSalones();

    const cupoInput = document.getElementById('cupo');
    if (cupoInput) {
        cupoInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }

    setupEventListeners();
    console.log('Inicialización completa');
});

function updateDateTime() {
    const now = new Date();
    const formatted = now.toLocaleString('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
    const el = document.getElementById('datetime');
    if (el) el.textContent = formatted;
}

function setupEventListeners() {
    // Regenerar clave al cambiar campos críticos
    ['cursoId', 'maestroId', 'dia', 'horaEntrada'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', generarClave);
    });

    const salon = document.getElementById('salon');
    if (salon) salon.addEventListener('change', function () { mostrarInfoSalon(this.value); });

    // Usar .onclick para evitar listeners duplicados si el DOM se recarga
    const nuevoBtn = document.getElementById('nuevoBtn');
    if (nuevoBtn) nuevoBtn.onclick = guardarGrupo;

    const cancelarBtn = document.getElementById('cancelarBtn');
    if (cancelarBtn) cancelarBtn.onclick = limpiarFormulario;

    const terminarBtn = document.getElementById('terminarBtn');
    if (terminarBtn) terminarBtn.onclick = () => {
        if (confirm('¿Desea salir?')) window.location.href = 'grupos.html';
    };
}

// Cargar catálogos con aislamiento de organización
async function cargarCursos() {
    if (!supabase) return;
    try {
        let query = supabase.from('cursos').select('*').order('curso');

        // Aislamiento: solo cursos de la organización actual
        if (typeof SessionManager !== 'undefined') {
            const user = SessionManager.getCurrentUser();
            const orgId = user?.organizacion_id;
            const isSA = user?.rol === 'SuperAdmin';
            if (!isSA && orgId) {
                query = supabase.from('cursos').select('*').eq('organizacion_id', orgId).order('curso');
            }
        }

        const { data, error } = await query;
        if (error) throw error;
        cursos = data || [];

        const select = document.getElementById('cursoId');
        if (select) {
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
    if (!supabase) return;
    try {
        let query = supabase.from('maestros').select('*').eq('activo', true).order('nombre');

        if (typeof SessionManager !== 'undefined') {
            const user = SessionManager.getCurrentUser();
            const orgId = user?.organizacion_id;
            const isSA = user?.rol === 'SuperAdmin';
            if (!isSA && orgId) {
                query = supabase.from('maestros').select('*').eq('activo', true).eq('organizacion_id', orgId).order('nombre');
            }
        }

        const { data, error } = await query;
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
    if (!supabase) return;
    try {
        let query;
        if (typeof SessionManager !== 'undefined') {
            query = SessionManager.applyIsolation(supabase.from('salones').select('*')).order('numero');
        } else {
            query = supabase.from('salones').select('*').order('numero');
        }

        const { data, error } = await query;
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

// Generación de Clave (ej: 1AXXLU20)
function generarClave() {
    const cursoId = document.getElementById('cursoId')?.value;
    const maestroId = document.getElementById('maestroId')?.value;
    const dia = document.getElementById('dia')?.value;
    const horaEntrada = document.getElementById('horaEntrada')?.value;

    if (!cursoId || !maestroId || !dia || !horaEntrada) {
        const ci = document.getElementById('clave');
        if (ci) ci.value = '';
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
        iniciales = partes.length >= 2
            ? partes.map(p => p[0]).join('').substring(0, 3)
            : maestro.nombre.substring(0, 3).toUpperCase();
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
    info.textContent = s ? `Cupo: ${s.cupo}` : '';
}

async function guardarGrupo() {
    // Protección contra doble clic
    if (g_guardandoGrupo) {
        console.warn('Ya se está guardando el grupo, ignorando clic duplicado.');
        return;
    }

    const clave = document.getElementById('clave')?.value?.trim();
    const cursoId = document.getElementById('cursoId')?.value;
    const maestroId = document.getElementById('maestroId')?.value;
    const dia = document.getElementById('dia')?.value;
    const horaEntrada = document.getElementById('horaEntrada')?.value;
    const horaSalida = document.getElementById('horaSalida')?.value;
    const fechaInicio = document.getElementById('inicio')?.value;

    if (!clave || !cursoId || !maestroId || !dia || !horaEntrada) {
        alert('Complete los campos obligatorios (Curso, Maestro, Día, Hora Entrada) para generar la clave.');
        return;
    }

    // 2. VALIDACIÓN CRÍTICA: Evitar strings vacíos en tipos TIME/DATE
    if (!horaEntrada || !horaSalida || !fechaInicio) {
        alert("Por favor, selecciona una Hora de Entrada, Hora de Salida y Fecha de Inicio válidas.");
        return;
    }

    if (!supabase) {
        alert('Error: No hay conexión a Supabase');
        return;
    }

    const cupo = parseInt(document.getElementById('cupo')?.value) || 0;
    if (cupo < 0) { alert('El cupo no puede ser negativo.'); return; }

    // Deshabilitar botón
    g_guardandoGrupo = true;
    const btn = document.getElementById('nuevoBtn');
    const btnTextoOriginal = btn ? btn.textContent : 'CREAR GRUPO';
    if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }

    try {
        const orgId = typeof SessionManager !== 'undefined'
            ? SessionManager.getCurrentUser()?.organizacion_id
            : null;

        // Verificar si la clave ya existe en esta organización
        let verifQuery = supabase.from('grupos').select('clave').eq('clave', clave);
        if (orgId) verifQuery = verifQuery.eq('organizacion_id', orgId);
        const { data: existente } = await verifQuery.maybeSingle();

        let claveUnica = clave;
        if (existente) {
            // Agregar sufijo numérico hasta encontrar clave disponible
            let sufijo = 2;
            while (sufijo <= 99) {
                claveUnica = `${clave}${sufijo}`;
                let dupQ = supabase.from('grupos').select('clave').eq('clave', claveUnica);
                if (orgId) dupQ = dupQ.eq('organizacion_id', orgId);
                const { data: dup } = await dupQ.maybeSingle();
                if (!dup) break;
                sufijo++;
            }
            const claveInput = document.getElementById('clave');
            if (claveInput) claveInput.value = claveUnica;
            console.log(`Clave duplicada detectada, usando nueva clave: ${claveUnica}`);
        }

        let fechaLeccion = document.getElementById('fechaLeccion')?.value || null;
        if (fechaLeccion === "") fechaLeccion = null; // Evitar string vacío en fecha

        const grupoData = {
            clave: claveUnica,
            curso_id: cursoId || null,
            maestro_id: maestroId || null,
            dia: dia || null,
            hora_entrada: horaEntrada || null,
            hora_salida: horaSalida || null,
            salon_id: document.getElementById('salon')?.value || null,
            cupo: cupo,
            fecha_inicio: fechaInicio || null,
            leccion: document.getElementById('leccion')?.value || '',
            fecha_leccion: fechaLeccion,
            tipo_pago_maestro: document.getElementById('tipo_pago_maestro')?.value || null,
            activo: true,
            ...(orgId ? { organizacion_id: orgId } : {})
        };

        console.log('Guardando grupo:', grupoData);
        const { error } = await supabase.from('grupos').insert([grupoData]);
        if (error) throw error;

        alert(`✓ Grupo "${claveUnica}" creado exitosamente.`);
        limpiarFormulario();

    } catch (e) {
        console.error('Error al guardar grupo:', e);
        alert('Error al crear grupo: ' + (e.message || e));
    } finally {
        g_guardandoGrupo = false;
        if (btn) { btn.disabled = false; btn.textContent = btnTextoOriginal; }
    }
}

function limpiarFormulario() {
    const form = document.getElementById('altaForm');
    if (form) form.reset();
    const claveInput = document.getElementById('clave');
    if (claveInput) claveInput.value = '';
    const info = document.getElementById('salonInfo');
    if (info) info.textContent = '';
}
