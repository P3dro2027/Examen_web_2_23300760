const express = require('express');
const router = express.Router();
const finanzaService = require('../services/finanza.service');
const { exigirSesion, soloPara } = require('../middleware/auth');

router.use(exigirSesion, soloPara('administrador'));

router.get('/resumen', (req, res) => {
    finanzaService.obtenerResumen((error, resumen) => {
        if (error) {
            return res.status(500).json({ mensaje: 'Error al consultar resumen financiero' });
        }
        res.json(resumen);
    });
});

router.get('/grafica', (req, res) => {
    finanzaService.obtenerGraficaSemanal((error, grafica) => {
        if (error) {
            return res.status(500).json({ mensaje: 'Error al consultar grafica' });
        }
        res.json(grafica);
    });
});

router.get('/reportes', (req, res) => {
    finanzaService.obtenerReportes((error, reportes) => {
        if (error) {
            return res.status(500).json({ mensaje: 'Error al consultar reportes' });
        }
        res.json(reportes);
    });
});

router.post('/movimiento', (req, res) => {
    finanzaService.registrarMovimiento(req.body, (error, resultado) => {
        if (error) {
            return res.status(500).json({ mensaje: 'Error al registrar movimiento' });
        }
        res.status(201).json(resultado);
    });
});

module.exports = router;
