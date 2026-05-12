// Actualizar fecha y hora
function actualizarFechaHora() {
    const ahora = new Date();
    
    const dia = String(ahora.getDate()).padStart(2, '0');
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const anio = ahora.getFullYear();
    
    let horas = ahora.getHours();
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    const segundos = String(ahora.getSeconds()).padStart(2, '0');
    
    const ampm = horas >= 12 ? 'p. m.' : 'a. m.';
    horas = horas % 12;
    horas = horas ? horas : 12;
    const horasStr = String(horas).padStart(2, '0');
    
    const fechaHoraStr = `${dia}/${mes}/${anio} ${horasStr}:${minutos}:${segundos} ${ampm}`;
    
    const dtEl = document.getElementById('datetime');
    if (dtEl) dtEl.textContent = fechaHoraStr;
}

// Actualizar cada segundo
setInterval(actualizarFechaHora, 1000);

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    actualizarFechaHora();
    
    // Aplicar protección de seguridad
    if (typeof SessionManager !== 'undefined') {
        const section = document.body.getAttribute('data-section') || 'Exámenes';
        SessionManager.protectPage(section);
    }
});
