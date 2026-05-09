/**
 * pdf-generator.js - Generación de recibos PDF dinámicos por organización
 */

const PDFGenerator = {
    /**
     * Convierte una URL de imagen a Base64
     * @param {string} url 
     * @returns {Promise<string>}
     */
    toBase64: function(url) {
        return new Promise((resolve, reject) => {
            if (!url) {
                resolve(null);
                return;
            }
            const img = new Image();
            img.setAttribute('crossOrigin', 'anonymous');
            img.onload = function() {
                const canvas = document.createElement('canvas');
                canvas.width = this.width;
                canvas.height = this.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(this, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = reject;
            img.src = url;
        });
    },

    /**
     * Genera el recibo en PDF
     * @param {object} datos - { reciboNo, fecha, cliente, rfc, total, filas, metodoPago }
     */
    generarRecibo: async function(datos) {
        const { jsPDF } = window.jspdf;
        const doc = jsPDF({ orientation: 'p', unit: 'mm', format: 'letter' });
        const user = SessionManager.getCurrentUser();

        // 1. Encabezado y Logo
        let logoBase64 = null;
        try {
            if (user.org_logo) {
                logoBase64 = await this.toBase64(user.org_logo);
            }
        } catch (e) {
            console.error('Error cargando logo para PDF:', e);
        }

        if (logoBase64) {
            doc.addImage(logoBase64, 'PNG', 15, 10, 30, 30);
        } else {
            doc.setFontSize(20);
            doc.setTextColor(40, 116, 166);
            doc.text('SCALA', 15, 25);
        }

        // Información de la Organización
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(user.org_nombre.toUpperCase(), 50, 20);
        doc.setFontSize(9);
        doc.text('Sistema de Gestión para Academias de Música', 50, 25);
        doc.text('Comprobante de Pago No Fiscal', 50, 30);

        // Datos del Recibo (Derecha)
        doc.setFontSize(10);
        doc.setFillColor(240, 240, 240);
        doc.rect(140, 10, 60, 25, 'F');
        doc.text(`RECIBO: #${datos.reciboNo}`, 145, 18);
        doc.text(`FECHA: ${datos.fecha}`, 145, 25);
        doc.text(`HORA: ${new Date().toLocaleTimeString()}`, 145, 32);

        // 2. Datos del Cliente
        doc.setDrawColor(200, 200, 200);
        doc.line(15, 45, 200, 45);
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('CLIENTE:', 15, 55);
        doc.setFont(undefined, 'normal');
        doc.text(datos.cliente || 'PUBLICO EN GENERAL', 40, 55);
        
        doc.setFont(undefined, 'bold');
        doc.text('RFC:', 15, 62);
        doc.setFont(undefined, 'normal');
        doc.text(datos.rfc || 'XAXX010101000', 40, 62);

        // 3. Tabla de Conceptos
        const head = [['Cant', 'Descripción', 'P. Unitario', 'IVA', 'Neto']];
        const body = datos.filas.map(f => [
            f.cantidad,
            f.operacion,
            `$${parseFloat(f.precio).toFixed(2)}`,
            `$${parseFloat(f.iva).toFixed(2)}`,
            `$${parseFloat(f.neto).toFixed(2)}`
        ]);

        doc.autoTable({
            startY: 70,
            head: head,
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [40, 116, 166], textColor: 255 },
            styles: { fontSize: 9 },
            columnStyles: {
                0: { cellWidth: 15 },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 25, halign: 'right' },
                3: { cellWidth: 20, halign: 'right' },
                4: { cellWidth: 25, halign: 'right' }
            }
        });

        // 4. Totales
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('MÉTODO DE PAGO:', 120, finalY);
        doc.setFont(undefined, 'normal');
        doc.text(datos.metodoPago || 'EFECTIVO', 160, finalY);

        doc.setFont(undefined, 'bold');
        doc.setFontSize(12);
        doc.text('TOTAL A PAGAR:', 120, finalY + 10);
        doc.setTextColor(200, 0, 0);
        doc.text(`$${parseFloat(datos.total).toFixed(2)}`, 160, finalY + 10);

        // 5. Pie de página
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(8);
        doc.text('Este documento no es un comprobante fiscal CFDI.', 105, 260, { align: 'center' });
        doc.text(`Generado por: ${user.nombre} | Scala SaaS 2.0`, 105, 265, { align: 'center' });

        // Abrir/Descargar
        doc.save(`Recibo_${datos.reciboNo}_${user.org_nombre.replace(/\s/g, '_')}.pdf`);
    }
};

window.PDFGenerator = PDFGenerator;
