const db = require('../config/db');

// lista de empleados con su ultimo salario registrado
function obtenerEmpleados(callback) {
    db.query(
        `SELECT e.id, e.nombre, e.puesto, e.horario,
                (SELECT n.monto_a_pagar FROM nomina n WHERE n.empleado_id = e.id ORDER BY n.id DESC LIMIT 1) AS salario
         FROM empleado e`,
        (error, rows) => {
            if (error) {
                callback(error, null);
                return;
            }
            const empleados = rows.map(e => ({
                id: e.id,
                nombre: e.nombre,
                puesto: e.puesto,
                salario: e.salario ? `$${e.salario} / qna` : '$0.00 / qna',
                turno: e.horario
            }));
            callback(null, empleados);
        }
    );
}

function agregarEmpleado(datos, callback) {
    const { nombre, puesto, horario, administrador_id } = datos;
    db.query(
        'INSERT INTO empleado (nombre, puesto, horario, administrador_id) VALUES (?, ?, ?, ?)',
        [nombre, puesto, horario, administrador_id || null],
        (error, resultado) => {
            if (error) {
                callback(error, null);
                return;
            }
            callback(null, { id: resultado.insertId, ...datos });
        }
    );
}

function editarEmpleado(id, datos, callback) {
    const { nombre, puesto, horario } = datos;
    db.query(
        'UPDATE empleado SET nombre = ?, puesto = ?, horario = ? WHERE id = ?',
        [nombre, puesto, horario, id],
        (error) => {
            if (error) {
                callback(error, null);
                return;
            }
            callback(null, { id, ...datos });
        }
    );
}

function eliminarEmpleado(id, callback) {
    db.query('DELETE FROM empleado WHERE id = ?', [id], (error) => {
        if (error) {
            callback(error, null);
            return;
        }
        callback(null, { mensaje: 'Empleado eliminado' });
    });
}

function registrarAsistencia(empleadoId, datos, callback) {
    const { fecha, hora_entrada, hora_salida, estado } = datos;
    db.query(
        'INSERT INTO asistencia (empleado_id, fecha, hora_entrada, hora_salida, estado) VALUES (?, ?, ?, ?, ?)',
        [empleadoId, fecha, hora_entrada, hora_salida, estado],
        (error, resultado) => {
            if (error) {
                callback(error, null);
                return;
            }
            callback(null, { id: resultado.insertId, empleadoId, ...datos });
        }
    );
}

// genera la nomina  y su egreso correspondiente en finanzas
function generarNomina(empleadoId, datos, callback) {
    const { periodo, monto_a_pagar } = datos;

    db.beginTransaction((error) => {
        if (error) {
            callback(error, null);
            return;
        }

        db.query(
            'INSERT INTO nomina (empleado_id, periodo, monto_a_pagar) VALUES (?, ?, ?)',
            [empleadoId, periodo, monto_a_pagar],
            (error, resultado) => {
                if (error) {
                    return db.rollback(() => callback(error, null));
                }

                const nominaId = resultado.insertId;

                db.query(
                    "INSERT INTO movimiento_financiero (tipo_movimiento, monto, fecha, descripcion, nomina_id) VALUES ('egreso', ?, NOW(), 'Pago de nomina', ?)",
                    [monto_a_pagar, nominaId],
                    (error) => {
                        if (error) {
                            return db.rollback(() => callback(error, null));
                        }

                        db.commit((error) => {
                            if (error) {
                                return db.rollback(() => callback(error, null));
                            }
                            callback(null, { id: nominaId, empleadoId, periodo, monto_a_pagar });
                        });
                    }
                );
            }
        );
    });
}

module.exports = {
    obtenerEmpleados,
    agregarEmpleado,
    editarEmpleado,
    eliminarEmpleado,
    registrarAsistencia,
    generarNomina
};
