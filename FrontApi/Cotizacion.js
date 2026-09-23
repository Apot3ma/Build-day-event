import os from 'os';
import path from 'path';
import express from 'express';
const router = express.Router();

import PDFDocument from 'pdfkit';
import fs from 'fs';
import fetch from 'node-fetch';

router.post('/:numeroCelular', async (req, res) => {
    const { numeroCelular } = req.params;
    const { producto, precio, cantidad = 1 } = req.body;

    if (!producto || !precio) {
        return res.status(400).json({ error: 'Faltan datos: producto y precio son requeridos' });
    }

    try {
        // ─── 1. Calcular montos ───────────────────────────────────────────
        const subtotalProducto = precio * cantidad;
        const iva             = subtotalProducto * 0.16;
        const total           = subtotalProducto + iva;
        const fecha           = new Date().toLocaleDateString('es-MX', {
                                    day: 'numeric', month: 'long', year: 'numeric'
                                });
        const vigencia        = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                                    .toLocaleDateString('es-MX', {
                                        day: 'numeric', month: 'long', year: 'numeric'
                                    });

        // ─── 2. Generar PDF ───────────────────────────────────────────────
        // ✅ Pon esto
        const pdfPath = path.join(os.tmpdir(), `cotizacion_${numeroCelular}_${Date.now()}.pdf`);
        const doc     = new PDFDocument({ margin: 50 });
        const stream  = fs.createWriteStream(pdfPath);
        doc.pipe(stream);

        const colorVerde   = '#2E7D32';
        const colorGris    = '#F5F5F5';
        const colorTexto   = '#212121';
        const colorMedio   = '#757575';

        // Encabezado
        doc.rect(0, 0, doc.page.width, 80).fill(colorVerde);
        doc.fillColor('white')
           .fontSize(20).font('Helvetica-Bold')
           .text('COTIZACIÓN DE PRODUCTOS Y SERVICIOS', 50, 20, { align: 'center' })
           .fontSize(12).font('Helvetica')
           .text('AGRÓNOMOS', { align: 'center' });

        doc.moveDown(2).fillColor(colorTexto);

        // Datos empresa
        doc.fontSize(13).font('Helvetica-Bold').fillColor(colorVerde)
           .text('1. Datos de la Empresa');
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke(colorVerde).moveDown(0.3);
        doc.fontSize(10).font('Helvetica').fillColor(colorTexto)
           .text('Empresa: AgroSoluciones del Valle S.A. de C.V.')
           .text('RFC: ASV240315MX1')
           .text('Dirección: Av. Agricultura #245, Ciudad de México, México')
           .text('Teléfono: +52 55 1234 5678')
           .text('Correo: ventas@agrosoluciones.mx')
           .text(`Fecha de cotización: ${fecha}`)
           .text(`Vigencia: 30 días naturales (hasta el ${vigencia})`);

        doc.moveDown();

        // Datos cliente
        doc.fontSize(13).font('Helvetica-Bold').fillColor(colorVerde)
           .text('2. Datos del Cliente');
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke(colorVerde).moveDown(0.3);
        doc.fontSize(10).font('Helvetica').fillColor(colorTexto)
           .text(`Teléfono de contacto: ${numeroCelular}`);

        doc.moveDown();

        // Tabla de productos
        doc.fontSize(13).font('Helvetica-Bold').fillColor(colorVerde)
           .text('3. Productos y Servicios Cotizados');
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke(colorVerde).moveDown(0.5);

        // Encabezado tabla
        const colProducto = 50, colCantidad = 280, colPrecio = 360, colSubtotal = 450;
        doc.rect(50, doc.y, 500, 20).fill(colorVerde);
        doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
        const yEncabezado = doc.y - 15;
        doc.text('Producto / Servicio', colProducto, yEncabezado)
           .text('Cantidad',           colCantidad,  yEncabezado)
           .text('Precio Unit.',       colPrecio,    yEncabezado)
           .text('Subtotal',           colSubtotal,  yEncabezado);
        doc.moveDown(0.3);

        // Fila de producto
        const yFila = doc.y;
        doc.rect(50, yFila, 500, 20).fill(colorGris);
        doc.fillColor(colorTexto).fontSize(10).font('Helvetica');
        doc.text(producto,                                colProducto, yFila + 5)
           .text(String(cantidad),                        colCantidad, yFila + 5)
           .text(`$${Number(precio).toLocaleString('es-MX')} MXN`,    colPrecio, yFila + 5)
           .text(`$${subtotalProducto.toLocaleString('es-MX')} MXN`,  colSubtotal, yFila + 5);
        doc.moveDown(2);

        // Resumen financiero
        doc.fontSize(13).font('Helvetica-Bold').fillColor(colorVerde)
           .text('4. Resumen Financiero');
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke(colorVerde).moveDown(0.5);

        const filas = [
            ['Subtotal',   `$${subtotalProducto.toLocaleString('es-MX')} MXN`],
            ['IVA (16%)',  `$${iva.toLocaleString('es-MX', {maximumFractionDigits: 2})} MXN`],
            ['TOTAL',      `$${total.toLocaleString('es-MX', {maximumFractionDigits: 2})} MXN`],
        ];

        filas.forEach(([concepto, monto], i) => {
            const yR = doc.y;
            if (i % 2 === 0) doc.rect(50, yR, 500, 20).fill(colorGris);
            const esTotal = concepto === 'TOTAL';
            doc.fillColor(esTotal ? colorVerde : colorTexto)
               .fontSize(esTotal ? 11 : 10)
               .font(esTotal ? 'Helvetica-Bold' : 'Helvetica')
               .text(concepto, 320, yR + 4)
               .text(monto,    440, yR + 4);
            doc.moveDown(esTotal ? 1.5 : 0.8);
        });

        // Condiciones comerciales
        doc.fontSize(13).font('Helvetica-Bold').fillColor(colorVerde)
           .text('5. Condiciones Comerciales');
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke(colorVerde).moveDown(0.3);
        const condiciones = [
            'Tiempo estimado de entrega: 7 a 10 días hábiles.',
            'Método de pago: Transferencia bancaria o depósito.',
            'Anticipo requerido: 50% para iniciar pedido e instalación.',
            'Garantía: 12 meses en sistemas seleccionados.',
            'Seguimiento técnico básico durante 30 días.',
        ];
        doc.fontSize(10).font('Helvetica').fillColor(colorTexto);
        condiciones.forEach(c => doc.text(`• ${c}`));

        doc.moveDown();

        // Footer
        doc.rect(0, doc.page.height - 60, doc.page.width, 60).fill(colorVerde);
        doc.fillColor('white').fontSize(10).font('Helvetica-Bold')
           .text('Ing. Laura Hernández — Gerente Comercial',
                 50, doc.page.height - 45, { align: 'center' })
           .font('Helvetica').fontSize(9)
           .text('AgroSoluciones del Valle S.A. de C.V. | ventas@agrosoluciones.mx | +52 55 1234 5678',
                 { align: 'center' });

        doc.end();

        // ─── 3. Esperar a que el PDF termine de escribirse ────────────────
        await new Promise((resolve, reject) => {
            stream.on('finish', resolve);
            stream.on('error', reject);
        });

        // ─── 4. Llamar al endpoint de WhatsApp ────────────────────────────
        const whatsappRes = await fetch('http://localhost:3000/enviar-cotizacion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telefono:       numeroCelular,
                urlPdf:         pdfPath,
                datosCotizacion: `${producto} x${cantidad} — Total: $${total.toLocaleString('es-MX', { maximumFractionDigits: 2 })} MXN`
            })
        });

        if (!whatsappRes.ok) {
            const errData = await whatsappRes.json();
            return res.status(500).json({ error: 'Error al enviar por WhatsApp', details: errData });
        }

        // ─── 5. Limpiar PDF temporal ──────────────────────────────────────
        fs.unlink(pdfPath, () => {});

        res.status(200).json({
            success: true,
            message: `Cotización de "${producto}" enviada al ${numeroCelular}`,
            total: `$${total.toLocaleString('es-MX', { maximumFractionDigits: 2 })} MXN`
        });

    } catch (err) {
        console.error('Error al generar/enviar cotización:', err);
        res.status(500).json({ error: 'Error interno', details: err.message });
    }
});

export default router;