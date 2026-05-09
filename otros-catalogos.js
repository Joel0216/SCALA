// Actualizar fecha y hora
function updateDateTime() {
    const now = new Date();
    const formatted = now.toLocaleString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    document.getElementById('datetime').textContent = formatted;
}

setInterval(updateDateTime, 1000);
updateDateTime();

// Event listeners para los botones de catálogos
document.getElementById('motivosBtn').addEventListener('click', () => {
    window.location.href = 'catalogo-motivos.html';
});

document.getElementById('instrumentosBtn').addEventListener('click', () => {
    window.location.href = 'catalogo-instrumentos.html';
});

document.getElementById('salonesBtn').addEventListener('click', () => {
    window.location.href = 'salones.html';
});

document.getElementById('mediosBtn').addEventListener('click', () => {
    window.location.href = 'catalogo-medios.html';
});

document.getElementById('terminarBtn').addEventListener('click', () => {
    window.location.href = 'archivos.html';
});
