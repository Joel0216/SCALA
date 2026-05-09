function actualizarFechaHora() {
    var now = new Date();
    var dt = document.getElementById('datetime');
    if (!dt) return;

    dt.textContent = now.toLocaleString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
}

document.addEventListener('DOMContentLoaded', function () {
    actualizarFechaHora();
    setInterval(actualizarFechaHora, 1000);
});

function irAConsultaRecibos() {
    window.location.href = 'cobros.html?view=consulta';
}

function irARecibosCancelados() {
    window.location.href = 'recibos_cancelados.html';
}

function irABajasAlumnos() {
    window.location.href = 'alumnos-bajas.html';
}

function irAReingresos() {
    // Usamos la pantalla de "Bajas" para reingreso por modal
    // (evita depender de localStorage que el flujo no siempre setea).
    window.location.href = 'alumnos-bajas.html';
}

function volverCaja() {
    window.location.href = 'caja.html';
}
