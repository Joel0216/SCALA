/**
 * rfc-clientes.js - Programmatic Event Binding Version
 * Ensures compatibility with Electron CSP and strict environments
 */

(function() {
    console.log("=== RFC CLIENTES: CARGANDO === (MODO BINDING)");

    let supabase = null;
    let g_rfcActual = null;
    let g_credencialesAsociadas = [];

    // --- FUNCIONES DE LÓGICA ---

    async function iniciarNuevo() {
        limpiarFormulario();
        habilitarCampos();
        document.getElementById('btnGroupDefault').style.display = 'none';
        document.getElementById('btnGroupEdicion').style.display = 'flex';
        renderCredencialesGrid(true); 
        document.getElementById('rfc').focus();
    }

    function cancelarNuevo() {
        document.getElementById('btnGroupDefault').style.display = 'flex';
        document.getElementById('btnGroupEdicion').style.display = 'none';
        limpiarFormulario();
    }

    async function guardarNuevo() {
        const rfc = document.getElementById('rfc').value.trim().toUpperCase();
        const nombre = document.getElementById('nombre').value.trim().toUpperCase();
        const direccion = document.getElementById('direccion').value.trim().toUpperCase();
        const correo = document.getElementById('correo').value.trim().toLowerCase();

        if (!rfc || !nombre) {
            await mostrarAlerta('RFC y Nombre son obligatorios.');
            return;
        }

        try {
            const { error } = await supabase.from('rfc_clientes').upsert({ rfc, nombre, direccion, correo });
            if (error) throw error;

            if (g_credencialesAsociadas.length > 0) {
                const batch = g_credencialesAsociadas.map(c => ({ rfc, credencial: c.credencial }));
                await supabase.from('rfc_credenciales').insert(batch);
            }
            await mostrarAlerta('RFC registrado correctamente.');
            cancelarNuevo();
        } catch (e) { await mostrarAlerta('Error: ' + e.message); }
    }

    async function borrarRFC() {
        if (!g_rfcActual) return;
        const seguro = await mostrarConfirm(`¿Borrar RFC ${g_rfcActual.rfc}?`);
        if (!seguro) return;
        try {
            await supabase.from('rfc_clientes').delete().eq('rfc', g_rfcActual.rfc);
            await mostrarAlerta('RFC eliminado');
            limpiarFormulario();
        } catch (e) { await mostrarAlerta('Error: ' + e.message); }
    }

    function abrirModalBusqueda() {
        document.getElementById('searchModal').style.display = 'flex'; 
        document.getElementById('bodyResultados').innerHTML = '<tr><td colspan="3" style="text-align:center;">Realice una búsqueda...</td></tr>';
        setTimeout(() => document.getElementById('searchInput').focus(), 100);
    }

    function cerrarModalBusqueda() {
        document.getElementById('searchModal').style.display = 'none';
    }

    async function buscarRFCs() {
        const term = document.getElementById('searchInput').value.trim().toUpperCase();
        try {
            let { data, error } = await supabase.from('rfc_clientes').select('*').or(`rfc.ilike.%${term}%,nombre.ilike.%${term}%`).limit(50);
            if (error) throw error;
            const tbody = document.getElementById('bodyResultados');
            tbody.innerHTML = '';
            if (!data || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No hay resultados.</td></tr>';
                return;
            }
            data.forEach(r => {
                const tr = document.createElement('tr');
                tr.style.cursor = 'pointer';
                tr.onclick = () => { cargarRFC(r); cerrarModalBusqueda(); };
                tr.innerHTML = `<td>${r.rfc}</td><td>${r.nombre}</td><td>${r.correo||''}</td>`;
                tbody.appendChild(tr);
            });
        } catch (e) { await mostrarAlerta(e.message); }
    }

    function cargarRFC(r) {
        g_rfcActual = r;
        document.getElementById('rfc').value = r.rfc;
        document.getElementById('rfcGridHeader').value = r.rfc;
        document.getElementById('nombre').value = r.nombre;
        document.getElementById('direccion').value = r.direccion || '';
        document.getElementById('correo').value = r.correo || '';
        deshabilitarCampos();
        document.getElementById('btnBorrar').disabled = false;
        supabase.from('rfc_credenciales').select('credencial').eq('rfc', r.rfc).then(({data}) => {
            g_credencialesAsociadas = data || [];
            renderCredencialesGrid(false);
        });
    }

    function renderCredencialesGrid(edicion = false) {
        const tbody = document.getElementById('credencialesGrid');
        if(!tbody) return;
        tbody.innerHTML = '';
        g_credencialesAsociadas.forEach((c, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td style="text-align:center;">${edicion ? `<button class="btnRemover" data-idx="${idx}" style="color:red; cursor:pointer;">X</button>` : '►'}</td><td>${c.credencial}</td>`;
            tbody.appendChild(tr);
        });
        
        if (edicion) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td style="text-align:center;">+</td><td><button id="btnVincularAlumno" class="premium-btn btn-primary" style="padding:2px 8px; font-size:12px;">Vincular...</button></td>`;
            tbody.appendChild(tr);
            
            const b = document.getElementById('btnVincularAlumno');
            if(b) b.onclick = (e) => { e.preventDefault(); abrirLupaAlumnos(); };
        }

        // Bind bntRemover
        document.querySelectorAll('.btnRemover').forEach(b => {
            b.onclick = (e) => {
                e.preventDefault();
                const idx = b.getAttribute('data-idx');
                g_credencialesAsociadas.splice(idx, 1);
                renderCredencialesGrid(true);
            };
        });
    }

    function abrirLupaAlumnos() { document.getElementById('modalLupaAlumnos').style.display = 'flex'; }
    function cerrarLupaAlumnos() { document.getElementById('modalLupaAlumnos').style.display = 'none'; }

    async function buscarAlumnosLupa() {
        const term = document.getElementById('inputLupaAlumnos').value.trim();
        try {
            let { data, error } = await supabase.from('alumnos').select('credencial, nombre').ilike('nombre', `%${term}%`).limit(20);
            const tbody = document.getElementById('bodyLupaAlumnos');
            if(!tbody) return;
            tbody.innerHTML = '';
            data.forEach(a => {
                const tr = document.createElement('tr');
                tr.style.cursor = 'pointer';
                tr.onclick = () => { g_credencialesAsociadas.push({ credencial: a.credencial }); renderCredencialesGrid(true); cerrarLupaAlumnos(); };
                tr.innerHTML = `<td>${a.credencial}</td><td>${a.nombre}</td>`;
                tbody.appendChild(tr);
            });
        } catch (e) { await mostrarAlerta(e.message); }
    }

    function limpiarFormulario() {
        g_rfcActual = null; g_credencialesAsociadas = [];
        ['rfc', 'nombre', 'direccion', 'correo', 'rfcGridHeader'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
        renderCredencialesGrid(false); deshabilitarCampos();
        if(document.getElementById('btnBorrar')) document.getElementById('btnBorrar').disabled = true;
    }

    function deshabilitarCampos() { ['rfc', 'nombre', 'direccion', 'correo'].forEach(id => { const el = document.getElementById(id); if(el) el.readOnly = true; }); }
    function habilitarCampos() { ['rfc', 'nombre', 'direccion', 'correo'].forEach(id => { const el = document.getElementById(id); if(el) el.readOnly = false; }); }

    // --- BINDING PRINCIPAL ---

    async function init() {
        if (typeof waitForSupabase === 'function') supabase = await waitForSupabase();
        else supabase = window.supabase || window.supabaseClient;

        if (!supabase) {
            console.error("Supabase client not found in RFC module");
            return;
        }

        // Vinculación de eventos
        const bind = (id, fn) => { const el = document.getElementById(id); if(el) el.addEventListener('click', fn); };
        
        bind('btnNuevo', iniciarNuevo);
        bind('btnBuscar', abrirModalBusqueda);
        bind('btnBorrar', borrarRFC);
        bind('btnTerminar', () => window.location.href = 'archivos.html');
        bind('btnCancelar', cancelarNuevo);
        bind('btnGuardar', guardarNuevo);
        
        // Modales
        bind('btnEjecutarBusqueda', buscarRFCs);
        bind('btnCerrarBusqueda', cerrarModalBusqueda);
        bind('btnEjecutarLupa', buscarAlumnosLupa);
        bind('btnCerrarLupa', cerrarLupaAlumnos);

        // Reloj
        setInterval(() => { const el = document.getElementById('datetime'); if(el) el.textContent = new Date().toLocaleString('es-MX'); }, 1000);
        
        limpiarFormulario();
        console.log("✓ RFC CLIENTES: LISTO Y VINCULADO");
    }

    document.addEventListener('DOMContentLoaded', init);

})();
