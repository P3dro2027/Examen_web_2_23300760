const db = require('../config/db');

function obtenerDistribuidores(callback) {
    db.query('SELECT id, nombre FROM distribuidor ORDER BY nombre', callback);
}

function validarNombre(nombre) {
    if (typeof nombre !== 'string' || !nombre.trim()) {
        const error = new Error('El nombre del distribuidor es obligatorio');
        error.code = 'VALIDATION';
        return error;
    }
    if (nombre.trim().length > 100) {
        const error = new Error('El nombre del distribuidor no puede superar los 100 caracteres');
        error.code = 'VALIDATION';
        return error;
    }
    return null;
}

function agregarDistribuidor(datos, callback) {
    const errorNombre = validarNombre(datos.nombre);
    if (errorNombre) {
        callback(errorNombre, null);
        return;
    }

    const nombre = datos.nombre.trim();
    db.query('INSERT INTO distribuidor (nombre) VALUES (?)', [nombre], (error, resultado) => {
        if (error) return callback(error, null);
        callback(null, { id: resultado.insertId, nombre });
    });
}

function editarDistribuidor(id, datos, callback) {
    const errorNombre = validarNombre(datos.nombre);
    if (errorNombre) {
        callback(errorNombre, null);
        return;
    }

    const nombre = datos.nombre.trim();
    db.query('UPDATE distribuidor SET nombre = ? WHERE id = ?', [nombre, id], (error) => {
        if (error) return callback(error, null);
        callback(null, { id: Number(id), nombre });
    });
}

function eliminarDistribuidor(id, callback) {
    db.query('DELETE FROM distribuidor WHERE id = ?', [id], (error) => {
        if (error) return callback(error, null);
        callback(null, { mensaje: 'Distribuidor eliminado' });
    });
}

module.exports = {
    obtenerDistribuidores,
    agregarDistribuidor,
    editarDistribuidor,
    eliminarDistribuidor
};
