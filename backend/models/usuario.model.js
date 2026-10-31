const db = require('../config/db');

// Modelo Usuario para operaciones de base de datos
const UsuarioModel = {
    buscarPorCredenciales: (correo, contrasena, callback) => {
        // Primero busca en administrador
        db.query(
            'SELECT id, correo FROM administrador WHERE correo = ? AND contrasena = ?',
            [correo, contrasena],
            (error, admins) => {
                if (error) return callback(error);
                if (admins.length > 0) {
                    return callback(null, { existe: true, rol: 'administrador', usuario: admins[0] });
                }

                // Luego busca en cliente
                db.query(
                    'SELECT id, correo FROM cliente WHERE correo = ? AND contrasena = ?',
                    [correo, contrasena],
                    (errorCli, clientes) => {
                        if (errorCli) return callback(errorCli);
                        if (clientes.length > 0) {
                            return callback(null, { existe: true, rol: 'cliente', usuario: clientes[0] });
                        }
                        return callback(null, { existe: false });
                    }
                );
            }
        );
    },

    crearCliente: (datos, callback) => {
        const { correo, contrasena } = datos;
        db.query(
            'INSERT INTO cliente (correo, contrasena) VALUES (?, ?)',
            [correo, contrasena],
            (error, resultado) => {
                if (error) return callback(error);
                callback(null, { id: resultado.insertId, correo });
            }
        );
    },

    buscarPorCorreo: (correo, callback) => {
        db.query(
            'SELECT id, correo FROM cliente WHERE correo = ? UNION SELECT id, correo FROM administrador WHERE correo = ?',
            [correo, correo],
            (error, rows) => {
                if (error) return callback(error);
                callback(null, rows.length > 0);
            }
        );
    }
};

module.exports = UsuarioModel;
