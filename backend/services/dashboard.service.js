const db = require('../config/db');

// junta los numeros que se muestran en las tarjetas del dashboard.
function obtenerResumenDashboard(callback) {
    const resultado = {};
    let pendientes = 4;
    let huboError = false;

    function terminarUno(error) {
        if (huboError) return;
        if (error) {
            huboError = true;
            callback(error, null);
            return;
        }
        pendientes -= 1;
        if (pendientes === 0) {
            callback(null, {
                finanzas: { ingresosMes: `$${Number(resultado.finanzas.ingresosMes).toFixed(2)}`, reportes: '---' },
                inventario: { productos: resultado.inventario.totalProductos, stockBajo: resultado.inventario.stockBajo || 0 },
                ventas: { ventasHoy: resultado.ventas.ventasHoy, totalDia: `$${Number(resultado.ventas.totalDia).toFixed(2)}` },
                rh: { empleados: resultado.rh.empleados, turnosHoy: resultado.rh.turnosHoy }
            });
        }
    }

    db.query(
        `SELECT COALESCE(SUM(CASE WHEN tipo_movimiento = 'ingreso' THEN monto ELSE 0 END), 0) AS "ingresosMes"
         FROM movimiento_financiero
         WHERE date_trunc('month', fecha) = date_trunc('month', CURRENT_DATE)`,
        (error, rows) => {
            if (error) return terminarUno(error);
            resultado.finanzas = rows[0];
            terminarUno(null);
        }
    );

    db.query(
        `SELECT COUNT(*) AS "totalProductos", SUM(CASE WHEN cantidad < 10 THEN 1 ELSE 0 END) AS "stockBajo" FROM producto`,
        (error, rows) => {
            if (error) return terminarUno(error);
            resultado.inventario = rows[0];
            terminarUno(null);
        }
    );

    db.query(
        `SELECT COUNT(*) AS "ventasHoy", COALESCE(SUM(monto), 0) AS "totalDia"
         FROM movimiento_financiero
         WHERE tipo_movimiento = 'ingreso' AND fecha::date = CURRENT_DATE`,
        (error, rows) => {
            if (error) return terminarUno(error);
            resultado.ventas = rows[0];
            terminarUno(null);
        }
    );

    db.query(
        `SELECT (SELECT COUNT(*) FROM empleado) AS empleados,
                (SELECT COUNT(*) FROM asistencia WHERE fecha = CURRENT_DATE) AS "turnosHoy"`,
        (error, rows) => {
            if (error) return terminarUno(error);
            resultado.rh = rows[0];
            terminarUno(null);
        }
    );
}

module.exports = { obtenerResumenDashboard };
