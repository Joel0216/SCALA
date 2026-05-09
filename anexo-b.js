/**
 * anexo-b.js - Anexo B Report Generator
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Current date format: 27-feb-2026
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const now = new Date();
    document.getElementById('fechaActual').textContent = `Información al:  ${now.getDate()}-${months[now.getMonth()]}-${now.getFullYear()}`;

    const params = new URLSearchParams(window.location.search);
    const clave = params.get('clave');

    if (!clave) {
        document.getElementById('reportContainer').innerHTML = '<h3 style="color:red; text-align:center;">No se proporcionó la clave del grupo.</h3>';
        return;
    }

    try {
        const client = window.supabase || (typeof getSupabase === 'function' ? getSupabase() : null);
        if (!client) throw new Error("Supabase client not loaded");

        const { data, error } = await client.from('grupos')
            .select(`*, cursos(curso), maestros(nombre)`)
            .eq('clave', clave)
            .single();

        if (error || !data) throw error || new Error("Grupo no encontrado");

        const mNombre = (data.maestros?.nombre || '__________').toUpperCase();
        const cNombre = (data.cursos?.curso || '__________').toUpperCase();
        const inscritos = data.alumnos_inscritos || 0;

        document.getElementById('firmaMaestro').textContent = mNombre;

        let html = `
            <div class="maestro-row">Maestro: ${mNombre}</div>
            <div class="curso-row">${cNombre}</div>
            <div class="grupo-row">
                <div class="clave">${data.clave}</div>
                <div class="alumnos">${inscritos}</div>
            </div>
            <p class="divider"></p>
            <div class="curso-row" style="margin-top:5px; font-size:11pt; padding-left: 20px;">Total de horas</div>
            <div class="totals-row">
                <span>Total de grupos: <span style="margin-left:20px;">1</span></span>
                <span>Total Alumnos: <span style="margin-left:20px;">${inscritos}</span></span>
            </div>
        `;
        document.getElementById('reportContainer').innerHTML = html;

    } catch (err) {
        console.error("Error cargando Anexo B:", err);
        document.getElementById('reportContainer').innerHTML = `<h3 style="color:red; text-align:center;">Error: ${err.message}</h3>`;
    }
});
