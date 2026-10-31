const jwt = require('jsonwebtoken');

class ErrorHttp extends Error {
    constructor(status, mensaje) {
        super(mensaje);
        this.status = status;
    }
}

function secretoJWT() {
    const secreto = process.env.JWT_SECRET;
    if (!secreto || secreto.length < 32) {
        throw new ErrorHttp(500, 'La clave JWT no esta configurada correctamente');
    }
    return secreto;
}

function emitirToken(usuario) {
    return jwt.sign(
        { id: usuario.id, rol: usuario.rol },
        secretoJWT(),
        { expiresIn: '8h' }
    );
}

function exigirSesion(req, res, next) {
    const encabezado = req.get('authorization') || '';
    const [tipo, credencial] = encabezado.split(' ');

    if (tipo !== 'Bearer' || !credencial) {
        return next(new ErrorHttp(401, 'Debes iniciar sesion para continuar'));
    }

    try {
        req.usuario = jwt.verify(credencial, secretoJWT());
        return next();
    } catch (error) {
        if (error instanceof ErrorHttp) {
            return next(error);
        }
        return next(new ErrorHttp(401, 'La sesion no es valida o ya vencio'));
    }
}

function soloPara(...roles) {
    return (req, res, next) => {
        if (!req.usuario || !roles.includes(req.usuario.rol)) {
            return next(new ErrorHttp(403, 'No tienes permisos para esta operacion'));
        }
        return next();
    };
}

function manejarErrores(error, req, res, next) {
    if (error instanceof ErrorHttp || error.status) {
        return res.status(error.status).json({ mensaje: error.message });
    }

    if (error.code === '23505') {
        return res.status(409).json({ mensaje: 'Ese dato ya esta registrado' });
    }

    if (error.code === '23503') {
        return res.status(409).json({ mensaje: 'No se puede completar: hay registros asociados o una referencia invalida' });
    }

    console.error('Error no controlado:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
}

module.exports = { ErrorHttp, emitirToken, exigirSesion, soloPara, manejarErrores };
