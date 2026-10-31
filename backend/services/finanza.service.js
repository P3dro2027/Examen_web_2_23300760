const db = require('../config/db');

// resumen de ingresos, egresos y utilidad del mes actual
function obtenerResumen(callback) {
    db.query(
        `SELECT
            COALESCE(SUM(CASE WHEN tipo_movimiento = 'ingreso' THEN monto ELSE 0 END), 0) AS "ingresosMes",
            COALESCE(SUM(CASE WHEN tipo_movimiento = 'egreso' THEN monto ELSE 0 END), 0) AS "egresosMes"
         FROM movimiento_financiero
         WHERE date_trunc('month', fecha) = date_trunc('month', CURRENT_DATE)`,
        (error, rows) => {
            if (error) {
                callback(error, null);
                return;
            }
            const ingresosMes = Number(rows[0].ingresosMes);
            const egresosMes = Number(rows[0].egresosMes);
            callback(null, {
                ingresosMes: `$${ingresosMes.toFixed(2)}`,
                egresosMes: `$${egresosMes.toFixed(2)}`,
                utilidadNeta: `$${(ingresosMes - egresosMes).toFixed(2)}`
            });
        }
    );
}

// ingresos y egresos agrupados por semana
function obtenerGraficaSemanal(callback) {
    db.query(
        `SELECT (EXTRACT(DAY FROM fecha)::int - 1 + EXTRACT(DOW FROM date_trunc('month', fecha))::int) / 7 + 1 AS semana,
                COALESCE(SUM(CASE WHEN tipo_movimiento = 'ingreso' THEN monto ELSE -monto END), 0) AS neto
         FROM movimiento_financiero
         WHERE date_trunc('month', fecha) = date_trunc('month', CURRENT_DATE)
         GROUP BY semana
         ORDER BY semana`,
        (error, rows) => {
            if (error) {
                callback(error, null);
                return;
            }
            const maximo = Math.max(1, ...rows.map(r => Math.abs(r.neto)));
            const grafica = rows.map(r => ({
                semana: `Sem ${r.semana}`,
                porcentajeAltura: Math.round((Math.abs(r.neto) / maximo) * 100)
            }));
            callback(null, grafica);
        }
    );
}

// movimientos financieros del mes
function obtenerReportes(callback) {
    db.query(
        `SELECT id, tipo_movimiento, monto, fecha, descripcion
         FROM movimiento_financiero
         ORDER BY fecha DESC
         LIMIT 20`,
        (error, rows) => {
            if (error) {
                callback(error, null);
                return;
            }
            const reportes = rows.map(r => ({
                id: r.id,
                nombre: r.descripcion || r.tipo_movimiento,
                periodo: new Date(r.fecha).toLocaleDateString(),
                fecha: new Date(r.fecha).toLocaleDateString(),
                formato: 'CSV'
            }));
            callback(null, reportes);
        }
    );
}

// Registra un movimiento financiero manual.
function registrarMovimiento(movimiento, callback) {
    const { tipo_movimiento, monto, descripcion } = movimiento;
    db.query(
        `INSERT INTO movimiento_financiero (tipo_movimiento, monto, fecha, descripcion)
         VALUES (?, ?, NOW(), ?)`,
        [tipo_movimiento, monto, descripcion],
        callback
    );
}

module.exports = {
    obtenerResumen,
    obtenerGraficaSemanal,
    obtenerReportes,
    registrarMovimiento
};
