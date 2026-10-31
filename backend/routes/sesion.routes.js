const express = require('express');
const router = express.Router();
const SesionController = require('../controllers/sesion.controller');

// Rutas de autenticación
router.post('/login', SesionController.login);
router.post('/registro', SesionController.registro);

module.exports = router;
