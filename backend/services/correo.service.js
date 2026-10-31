// Envia el recibo con el XML adjunto y datos generales de la compra
async function enviarRecibo({ cliente, venta, factura, captureId }) {
    const metodoNombre = (venta.metodoPago || venta.metodo_pago || 'paypal').toLowerCase().includes('paypal') 
        ? 'PayPal' 
        : 'Efectivo';
        
    const lineas = [
        `Hola ${cliente?.nombre || 'Cliente'}, gracias por tu compra en ERP Cafeteria.`,
        '',
        '--- DATOS GENERALES DE LA COMPRA ---',
        `Folio: ${factura?.folio || factura?.id || venta?.id}`,
        `Fecha: ${new Date().toLocaleString('es-MX')}`,
        `Metodo de pago: ${metodoNombre}`,
        `Subtotal: $${Number(venta?.subtotal || (venta?.total ? venta.total / 1.16 : 0)).toFixed(2)} MXN`,
        `IVA (16%): $${Number(venta?.iva || (venta?.total ? venta.total - (venta.total / 1.16) : 0)).toFixed(2)} MXN`,
        `Total pagado: $${Number(venta?.total || 0).toFixed(2)} MXN`
    ];

    if (metodoNombre === 'PayPal') {
        lineas.push(
            '',
            '--- DETALLES PAYPAL ---',
            `Orden: ${venta?.paypalOrderId || venta?.orden_paypal_id || ''}`,
            `ID de Captura: ${captureId || 'Capturado exitosamente'}`
        );
    }

    lineas.push('', 'Adjuntamos tu comprobante fiscal en formato XML.');

    const destino = process.env.MAIL_DESTINO || (cliente?.correo ? cliente.correo.trim() : '');

    try {
        if (!process.env.RESEND_API_KEY) {
            return true;
        }

        const respuesta = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: process.env.MAIL_FROM || 'ERP Cafeteria <onboarding@resend.dev>',
                to: [destino],
                subject: `Recibo de Compra ${factura?.folio || ''} - ERP Cafeteria`,
                text: lineas.join('\n'),
                attachments: [{
                    filename: `${factura?.folio || 'comprobante'}.xml`,
                    content: Buffer.from(factura?.xml || factura?.archivo_xml || '').toString('base64')
                }]
            })
        });

        if (!respuesta.ok) {
            const errTexto = await respuesta.text();
            console.error('Error al enviar correo:', errTexto);
            throw new Error(errTexto);
        }
        return true;
    } catch (error) {
        console.error('No se pudo enviar el correo:', error.message);
        return false;
    }
}

module.exports = { enviarRecibo };
