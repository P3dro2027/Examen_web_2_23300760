const UsuarioModel = require('../models/usuario.model');
const { emitirToken } = require('../middleware/auth');

// Validaciones
function validarTexto(texto, campo, maxLen = 255) {
    if (!texto || typeof texto !== 'string' || !texto.trim()) {
        return `El campo "${campo}" no puede estar vacío.`;
    }
    const limpio = texto.trim();
    if (limpio.length > maxLen) {
        return `El campo "${campo}" no puede superar los ${maxLen} caracteres.`;
    }
    if (/[<>;]|\-\-/.test(limpio)) {
        return `El campo "${campo}" contiene caracteres especiales no permitidos (<, >, ;, --).`;
    }
    return null;
}

function validarCorreo(correo) {
    const err = validarTexto(correo, 'Correo electrónico', 100);
    if (err) return err;
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(correo.trim())) {
        return 'El correo electrónico debe tener un formato válido (usuario@dominio.com).';
    }
    return null;
}

const SesionController = {
    login: (req, res) => {
        const { correo, contrasena } = req.body;

        const errCorreo = validarCorreo(correo);
        if (errCorreo) return res.status(400).json({ mensaje: errCorreo });

        const errPass = validarTexto(contrasena, 'Contraseña', 100);
        if (errPass) return res.status(400).json({ mensaje: errPass });

        UsuarioModel.buscarPorCredenciales(correo.trim(), contrasena, (error, resultado) => {
            if (error) {
                console.error('Error en login:', error);
                return res.status(500).json({ mensaje: 'Error al verificar credenciales' });
            }

            if (!resultado || !resultado.existe) {
                return res.status(401).json({
                    existe: false,
                    mensaje: 'Correo o contraseña incorrectos. Verifique sus datos.'
                });
            }

            try {
                res.json({
                    existe: true,
                    rol: resultado.rol,
                    usuario: resultado.usuario,
                    token: emitirToken({ id: resultado.usuario.id, rol: resultado.rol }),
                    mensaje: 'Inicio de sesión correcto'
                });
            } catch (errorToken) {
                console.error('Error al crear la sesion:', errorToken);
                res.status(errorToken.status || 500).json({
                    mensaje: errorToken.message || 'No se pudo iniciar la sesion'
                });
            }
        });
    },

    registro: (req, res) => {
        const { correo, contrasena } = req.body;

        const errCorreo = validarCorreo(correo);
        if (errCorreo) return res.status(400).json({ mensaje: errCorreo });

        const errPass = validarTexto(contrasena, 'Contraseña', 100);
        if (errPass) return res.status(400).json({ mensaje: errPass });

        UsuarioModel.buscarPorCorreo(correo.trim(), (errBuscar, yaExiste) => {
            if (errBuscar) {
                return res.status(500).json({ mensaje: 'Error al validar disponibilidad del correo' });
            }

            if (yaExiste) {
                return res.status(409).json({ mensaje: 'El correo electrónico ya se encuentra registrado' });
            }

            UsuarioModel.crearCliente({
                correo: correo.trim(),
                contrasena: contrasena.trim()
            }, (errCrear, nuevoCliente) => {
                if (errCrear) {
                    console.error('Error al registrar cliente:', errCrear);
                    return res.status(500).json({ mensaje: 'Error al crear la cuenta de cliente' });
                }

                res.status(201).json({
                    mensaje: 'Cuenta creada exitosamente',
                    cliente: nuevoCliente
                });
            });
        });
    }
};

module.exports = SesionController;
