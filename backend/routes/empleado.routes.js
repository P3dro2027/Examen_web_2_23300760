const express = require('express');
const router = express.Router();
const empleadoService = require('../services/empleado.service');
const { exigirSesion, soloPara } = require('../middleware/auth');

router.use(exigirSesion, soloPara('administrador'));

router.get('/', (req, res) => {
    empleadoService.obtenerEmpleados((error, empleados) => {
        if (error) {
            return res.status(500).json({ mensaje: 'Error al consultar empleados' });
        }
        res.json(empleados);
    });
});

router.post('/', (req, res) => {
    empleadoService.agregarEmpleado(req.body, (error, empleado) => {
        if (error) {
            return res.status(500).json({ mensaje: 'Error al agregar empleado' });
        }
        res.status(201).json(empleado);
    });
});

router.put('/:id', (req, res) => {
    empleadoService.editarEmpleado(req.params.id, req.body, (error, empleado) => {
        if (error) {
            return res.status(500).json({ mensaje: 'Error al editar empleado' });
        }
        res.json(empleado);
    });
});

router.delete('/:id', (req, res) => {
    empleadoService.eliminarEmpleado(req.params.id, (error, resultado) => {
        if (error) {
            return res.status(500).json({ mensaje: 'Error al eliminar empleado' });
        }
        res.json(resultado);
    });
});

router.post('/:id/asistencia', (req, res) => {
    empleadoService.registrarAsistencia(req.params.id, req.body, (error, asistencia) => {
        if (error) {
            return res.status(500).json({ mensaje: 'Error al registrar asistencia' });
        }
        res.status(201).json(asistencia);
    });
});

router.post('/:id/nomina', (req, res) => {
    empleadoService.generarNomina(req.params.id, req.body, (error, nomina) => {
        if (error) {
            return res.status(500).json({ mensaje: 'Error al generar nomina' });
        }
        res.status(201).json(nomina);
    });
});

module.exports = router;
