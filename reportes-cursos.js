// Reporte de Cursos
let db = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('=== CARGANDO REPORTE DE CURSOS ===');
    
    await new Promise(r => setTimeout(r, 500));
    
    db = window.supabaseClient || window.supabase || (typeof getSupabase === 'function' ? getSupabase() : null);
    
    mostrarFecha();
    
    if (db) {
        await cargarCursosDB();
    } else {
        console.log('Sin conexión a BD, usando datos de ejemplo');
        cargarCursosEjemplo();
    }
});

function mostrarFecha() {
    const ahora = new Date();
    const dia = ahora.getDate();
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const mes = meses[ahora.getMonth()];
    const anio = ahora.getFullYear();
    document.getElementById('fecha').textContent = `${dia}-${mes}-${anio}`;
}

async function cargarCursosDB() {
    try {
        const { data, error } = await db.from('cursos').select('*').order('curso');
        
        if (error) throw error;
        
        const tbody = document.getElementById('tablaCursos');
        tbody.innerHTML = '';
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay cursos registrados</td></tr>';
            return;
        }
        
        data.forEach(curso => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${curso.curso || ''}</td>
                <td>${(curso.precio_mensual || 0).toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td>${curso.clave || ''}</td>
                <td>${(curso.iva || 0.16).toFixed(2)}</td>
                <td>${(curso.precio_inscripcion || 0).toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            `;
            tbody.appendChild(tr);
        });
        
        console.log(`✓ ${data.length} cursos cargados en reporte`);
    } catch (e) {
        console.error('Error cargando cursos:', e);
        cargarCursosEjemplo();
    }
}

function cargarCursosEjemplo() {
    const cursosEjemplo = [
        { curso: 'ANUALIDAD', costo: 300.00, clave: 'AN', iva: 0.16, recargo: 0.00 },
        { curso: 'Baby Music', costo: 770.00, clave: 'BM', iva: 0.16, recargo: 550.00 },
        { curso: 'Bajo Electrico 1', costo: 770.00, clave: 'BE', iva: 0.16, recargo: 550.00 },
        { curso: 'Bajo Individual 1', costo: 1280.00, clave: 'BI', iva: 0.16, recargo: 850.00 },
        { curso: 'Bateria 1', costo: 770.00, clave: 'BA', iva: 0.16, recargo: 550.00 },
        { curso: 'Canto 1', costo: 770.00, clave: 'CA', iva: 0.16, recargo: 550.00 },
        { curso: 'Guitarra Acustica 1', costo: 770.00, clave: 'GA', iva: 0.16, recargo: 550.00 },
        { curso: 'Guitarra Electrica 1', costo: 770.00, clave: 'GE', iva: 0.16, recargo: 550.00 },
        { curso: 'INSCRIPCION', costo: 550.00, clave: 'IN', iva: 0.16, recargo: 0.00 },
        { curso: 'Piano 1', costo: 770.00, clave: 'PI', iva: 0.16, recargo: 550.00 },
        { curso: 'Violin 1', costo: 770.00, clave: 'VI', iva: 0.16, recargo: 550.00 }
    ];
    
    const tbody = document.getElementById('tablaCursos');
    tbody.innerHTML = '';
    
    cursosEjemplo.forEach(curso => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${curso.curso}</td>
            <td>${curso.costo.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td>${curso.clave}</td>
            <td>${curso.iva.toFixed(2)}</td>
            <td>${curso.recargo.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        `;
        tbody.appendChild(tr);
    });
}
