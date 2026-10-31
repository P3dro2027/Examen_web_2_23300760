const express = require('express');
const router = express.Router();
const distribuidorService = require('../services/distribuidor.service');
const { exigirSesion, soloPara } = require('../middleware/auth');

router.use(exigirSesion, soloPara('administrador'));

router.get('/', (req, res) => {
    distribuidorService.obtenerDistribuidores((error, distribuidores) => {
        if (error) return res.status(500).json({ mensaje: 'Error al consultar distribuidores' });
        res.json(distribuidores);
    });
});

router.post('/', (req, res) => {
    distribuidorService.agregarDistribuidor(req.body, (error, distribuidor) => {
        if (error) {
            const status = error.code === 'VALIDATION' ? 400 : 500;
            return res.status(status).json({ mensaje: error.message || 'Error al agregar distribuidor' });
        }
        res.status(201).json(distribuidor);
    });
});

router.put('/:id', (req, res) => {
    distribuidorService.editarDistribuidor(req.params.id, req.body, (error, distribuidor) => {
        if (error) {
            const status = error.code === 'VALIDATION' ? 400 : 500;
            return res.status(status).json({ mensaje: error.message || 'Error al editar distribuidor' });
        }
        res.json(distribuidor);
    });
});

router.delete('/:id', (req, res) => {
    distribuidorService.eliminarDistribuidor(req.params.id, (error, resultado) => {
        if (error) return res.status(500).json({ mensaje: 'Error al eliminar distribuidor' });
        res.json(resultado);
    });
});

module.exports = router;
