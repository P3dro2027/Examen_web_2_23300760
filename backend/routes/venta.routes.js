const express = require('express');
const router = express.Router();
const ventaService = require('../services/venta.service');
const { exigirSesion, soloPara } = require('../middleware/auth');

router.use(exigirSesion, soloPara('administrador', 'cliente'));

router.get('/resumen', (req, res) => {
    ventaService.obtenerResumenVentas((error, resumen) => {
        if (error) {
            return res.status(500).json({ mensaje: 'Error al consultar resumen de ventas' });
        }
        res.json(resumen);
    });
});

router.get('/', (req, res) => {
    ventaService.obtenerVentas(req.query.cliente_id, (error, ventas) => {
        if (error) {
            return res.status(500).json({ mensaje: 'Error al consultar ventas' });
        }
        res.json(ventas);
    });
});

router.post('/', (req, res) => {
    const datosVenta = {
        ...req.body,
        cliente_id: req.usuario.rol === 'cliente' ? req.usuario.id : null
    };

    ventaService.crearVenta(datosVenta, (error, venta) => {
        if (error) {
            return res.status(400).json({ mensaje: error.message || 'Error al registrar venta' });
        }
        res.status(201).json(venta);
    });
});

router.get('/:id/factura', (req, res) => {
    ventaService.obtenerFacturaPorVenta(req.params.id, req.query.cliente_id, (error, factura) => {
        if (error) {
            return res.status(500).json({ mensaje: 'Error al consultar factura' });
        }
        if (!factura) {
            return res.status(404).json({ mensaje: 'Factura no encontrada o no pertenece al usuario' });
        }
        res.json(factura);
    });
});

module.exports = router;