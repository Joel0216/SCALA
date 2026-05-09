/**
 * utils-pagination.js - Sistema de Paginación Server-Side (Senior Fix)
 */

window.renderPaginador = function (containerId, total, paginaActual, rowsPorPagina, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const totalPaginas = Math.ceil(total / rowsPorPagina) || 1;

    // Inyectar HTML con estética Windows 98/2000
    container.innerHTML = `
        <div class="pagination-senior-bar" style="display: flex; align-items: center; gap: 8px; font-family: 'MS Sans Serif', Arial; font-size: 11px; padding: 4px; background: #d4d0c8; border-top: 1px solid #ffffff; border-left: 1px solid #ffffff; border-right: 1px solid #808080; border-bottom: 1px solid #808080; margin-top: 5px;">
            <span style="margin-right: 10px;">Registro:</span>
            <button id="pg-first" class="btn-win98" ${paginaActual === 1 ? 'disabled' : ''}>|◄</button>
            <button id="pg-prev" class="btn-win98" ${paginaActual === 1 ? 'disabled' : ''}>◄</button>
            
            <input type="text" value="${paginaActual}" readonly style="width: 30px; height: 18px; text-align: center; border: 2px inset #ffffff;">
            
            <button id="pg-next" class="btn-win98" ${paginaActual >= totalPaginas ? 'disabled' : ''}>►</button>
            <button id="pg-last" class="btn-win98" ${paginaActual >= totalPaginas ? 'disabled' : ''}>►|</button>
            
            <span style="margin-left: 10px;">Página <b>${paginaActual}</b> de <b>${totalPaginas}</b> – <b>${total}</b> registros totales</span>
        </div>
    `;

    // Eventos
    container.querySelector('#pg-first').onclick = () => onPageChange(1);
    container.querySelector('#pg-prev').onclick = () => onPageChange(Math.max(1, paginaActual - 1));
    container.querySelector('#pg-next').onclick = () => onPageChange(Math.min(totalPaginas, paginaActual + 1));
    container.querySelector('#pg-last').onclick = () => onPageChange(totalPaginas);

    // Inyectar estilos CSS específicos si no existen
    if (!document.getElementById('paginador-styles-senior')) {
        const style = document.createElement('style');
        style.id = 'paginador-styles-senior';
        style.textContent = `
            .btn-win98 {
                width: 22px; height: 20px;
                padding: 0;
                background: #c0c0c0;
                border: 2px outset #ffffff;
                font-weight: bold;
                cursor: pointer;
                display: flex; align-items: center; justify-content: center;
            }
            .btn-win98:active:not([disabled]) {
                border-style: inset;
                padding: 1px 0 0 1px;
            }
            .btn-win98[disabled] {
                color: #888888;
                cursor: default;
            }
        `;
        document.head.appendChild(style);
    }
};
