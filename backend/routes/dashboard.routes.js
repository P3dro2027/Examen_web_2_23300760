const express = require('express');
const router = express.Router();
const dashboardService = require('../services/dashboard.service');
const { exigirSesion, soloPara } = require('../middleware/auth');

router.use(exigirSesion, soloPara('administrador'));

router.get('/', (req, res) => {
    dashboardService.obtenerResumenDashboard((error, resumen) => {
        if (error) {
            return res.status(500).json({ mensaje: 'Error al consultar dashboard' });
        }
        res.json(resumen);
    });
});

module.exports = router;
