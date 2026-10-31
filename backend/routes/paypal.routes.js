const express = require('express');
const router = express.Router();
const paypalService = require('../services/paypal.service');
const ventaService = require('../services/venta.service');
const correoService = require('../services/correo.service');
const { exigirSesion, soloPara } = require('../middleware/auth');

// Crea una orden PayPal con los productos y datos del cliente.
const manejarCrearOrden = (req, res) => {
    // Normalizar datos de entrada
    const productos = req.body.productos || req.body.items || [];
    const cliente = req.body.cliente || {
        nombre: req.body.nombreReceptor || req.body.nombreCliente || 'Cliente',
        rfc: req.body.rfcReceptor || 'XAXX010101000',
        correo: req.body.correo || req.body.correoCliente || ''
    };

    if (!Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({ mensaje: 'El carrito no contiene productos' });
    }

    // Normalizar items a formato esperado por ventaService
    const items = productos.map(p => ({
        producto_id: p.id || p.producto_id,
        nombre: p.nombre,
        cantidad: p.cantidad,
        precio_unitario: p.precio || p.precio_unitario
    }));

    // 1. Validar existencias de inventario
    ventaService.validarStockOrden(items, (errStock, calculo) => {
        if (errStock) {
            return res.status(400).json({ mensaje: errStock.message });
        }

        // 2. Crear orden en PayPal con montos validados
        paypalService.crearOrdenPayPal({
            subtotal: calculo.subtotal,
            iva: calculo.iva,
            total: calculo.total,
            items: calculo.detalle,
            cliente
        }, (errPayPal, ordenPayPal) => {
            if (errPayPal) {
                return res.status(500).json({ mensaje: 'Error al iniciar pago con PayPal: ' + errPayPal.message });
            }

            res.json({
                id: ordenPayPal.id,
                orderID: ordenPayPal.id,
                status: ordenPayPal.status,
                total: calculo.total,
                urlPago: ordenPayPal.approveUrl,
                approveUrl: ordenPayPal.approveUrl,
                resumen: calculo
            });
        });
    });
};

router.post('/orden', exigirSesion, soloPara('administrador', 'cliente'), manejarCrearOrden);

// Captura una orden PayPal aprobada y registra la venta.
const manejarCapturarOrden = (req, res) => {
    const orderID = req.params.orderId || req.body.orderID || req.body.orderId;
    const datosVenta = req.body.datosVenta || req.body;

    if (!orderID) {
        return res.status(400).json({ mensaje: 'Falta el orderID de PayPal' });
    }

    // Capturar orden en PayPal
    paypalService.capturarOrdenPayPal(orderID, (errCaptura, respuestaPayPal) => {
        if (errCaptura) {
            return res.status(500).json({
                estado: 'RECHAZADO',
                mensaje: 'Error procesando pago con PayPal: ' + errCaptura.message
            });
        }

        if (respuestaPayPal.estado === 'PENDIENTE') {
            return res.status(202).json({
                estado: 'PENDIENTE',
                mensaje: respuestaPayPal.mensaje || 'Pago en revisión por PayPal'
            });
        }

        if (respuestaPayPal.estado !== 'APROBADO') {
            return res.status(400).json({
                estado: 'RECHAZADO',
                mensaje: respuestaPayPal.mensaje || 'El pago fue rechazado por PayPal'
            });
        }

        // Pago Aprobado: registrar la venta y generar factura XML
        const ventaPayload = {
            cliente_id: req.usuario?.rol === 'cliente' ? req.usuario.id : null,
            nombre_cliente: datosVenta?.nombre_cliente || datosVenta?.nombreReceptor || 'Cliente',
            rfc_cliente: datosVenta?.rfc_cliente || datosVenta?.rfcReceptor || 'XAXX010101000',
            telefono_cliente: datosVenta?.telefono_cliente || '',
            correo_cliente: datosVenta?.correo_cliente || datosVenta?.correo || '',
            direccion_entrega: datosVenta?.direccion_entrega || 'Entrega en tienda',
            detalle: datosVenta?.detalle || [],
            orden_paypal_id: orderID,
            metodo_pago: `PayPal`
        };

        ventaService.crearVenta(ventaPayload, async (errVenta, resultadoVenta) => {
            if (errVenta) {
                return res.status(500).json({
                    estado: 'ERROR_REGISTRO',
                    mensaje: 'Pago aprobado en PayPal pero hubo un problema al registrar la venta en ERP: ' + errVenta.message
                });
            }

            // Enviar correo con el XML de la compra y datos generales
            const correoEnviado = await correoService.enviarRecibo({
                cliente: {
                    nombre: ventaPayload.nombre_cliente,
                    correo: ventaPayload.correo_cliente
                },
                venta: {
                    id: resultadoVenta.id,
                    metodoPago: 'paypal',
                    subtotal: resultadoVenta.subtotal || (resultadoVenta.total / 1.16),
                    iva: resultadoVenta.iva,
                    total: resultadoVenta.total,
                    paypalOrderId: orderID
                },
                factura: {
                    folio: resultadoVenta.folio,
                    xml: resultadoVenta.archivo_xml
                },
                captureId: respuestaPayPal.transaccionId || orderID
            });

            res.json({
                mensaje: 'Pago completado con éxito',
                orderId: orderID,
                captureId: respuestaPayPal.transaccionId || orderID,
                estado: 'APROBADO',
                folio: resultadoVenta.folio,
                correoEnviado,
                venta: resultadoVenta
            });
        });
    });
};

router.post('/capturar/:orderId', exigirSesion, soloPara('administrador', 'cliente'), manejarCapturarOrden);

module.exports = router;
