const db = require('../config/db');
const { generarFacturaXML } = require('./xml.service');

// Resumen de ventas para el dashboard y panel
function obtenerResumenVentas(callback) {
    db.query(
        `SELECT COUNT(*) AS "ventasHoy",
                COALESCE(SUM(monto), 0) AS "totalDia",
                COALESCE(SUM(ROUND(monto * 0.16 / 1.16, 2)), 0) AS "ivaAcumulado"
         FROM movimiento_financiero
         WHERE tipo_movimiento = 'ingreso' AND fecha::date = CURRENT_DATE`,
        (error, rows) => {
            if (error) return callback(error, null);
            callback(null, rows[0] || { ventasHoy: 0, totalDia: 0, ivaAcumulado: 0 });
        }
    );
}

// Consulta de ventas / facturas generadas por PayPal
function obtenerVentas(clienteId, callback) {
    let sql = `SELECT f.id AS folio,
                      COALESCE(c.correo, 'Público general') AS cliente,
                      COALESCE(f.orden_paypal_id, 'PayPal') AS canal,
                      f.fecha_emision,
                      f.archivo_xml,
                      'Facturada' AS "estadoFactura"
               FROM factura f
               LEFT JOIN cliente c ON c.id = f.cliente_id`;

    const parametros = [];
    if (clienteId) {
        sql += ' WHERE f.cliente_id = ?';
        parametros.push(clienteId);
    }
    sql += ' ORDER BY f.fecha_emision DESC';

    db.query(sql, parametros, (error, rows) => {
        if (error) return callback(error, null);

        const ventas = rows.map(f => {
            // Extrae montos del XML o defaults si existen
            let total = '$0.00';
            let iva = '$0.00';
            if (f.archivo_xml) {
                const totalMatch = f.archivo_xml.match(/Total="([^"]+)"/);
                const ivaMatch = f.archivo_xml.match(/TotalImpuestosTrasladados="([^"]+)"/);
                if (totalMatch) total = `$${Number(totalMatch[1]).toFixed(2)}`;
                if (ivaMatch) iva = `$${Number(ivaMatch[1]).toFixed(2)}`;
            }

            return {
                folio: f.folio,
                cliente: f.cliente,
                canal: f.canal,
                total,
                iva,
                estadoFactura: f.estadoFactura,
                claseEstado: 'verde'
            };
        });

        callback(null, ventas);
    });
}

// Validacion de stock disponible en producto
function validarStockOrden(items, callback) {
    if (!items || !items.length) {
        return callback(new Error('El carrito no contiene productos'));
    }

    const ids = items.map(it => Number(it.producto_id)).filter(id => !isNaN(id) && id > 0);
    if (!ids.length) {
        return callback(new Error('Productos invalidos en la orden'));
    }

    db.query('SELECT id, nombre, precio, cantidad FROM producto WHERE id = ANY(?)', [ids], (error, productos) => {
        if (error) return callback(error);

        const map = new Map(productos.map(p => [p.id, p]));
        const detalle = [];
        let subtotal = 0;

        for (const it of items) {
            const p = map.get(Number(it.producto_id));
            if (!p) return callback(new Error(`Producto no encontrado (ID ${it.producto_id})`));
            if (p.cantidad < it.cantidad) {
                return callback(new Error(`Stock insuficiente para "${p.nombre}". Disponible: ${p.cantidad}`));
            }

            const precio = Number(p.precio || 0);
            const cant = Number(it.cantidad || 1);
            const itemSub = cant * precio;
            subtotal += itemSub;

            detalle.push({
                producto_id: p.id,
                nombre: p.nombre,
                cantidad: cant,
                precio_unitario: precio
            });
        }

        const iva = Number((subtotal * 0.16).toFixed(2));
        const total = Number((subtotal + iva).toFixed(2));
        callback(null, { subtotal, iva, total, detalle });
    });
}

// Registra la venta procesada por PayPal sin depender de tabla venta
function crearVenta(datos, callback) {
    const {
        cliente_id,
        nombre_cliente = 'Cliente',
        correo_cliente = '',
        orden_paypal_id = 'PAYPAL-' + Date.now(),
        detalle = []
    } = datos;

    validarStockOrden(detalle, (errVal, calculo) => {
        if (errVal) return callback(errVal, null);

        const { subtotal, iva, total, detalle: itemsVerificados } = calculo;

        db.beginTransaction((errTx) => {
            if (errTx) return callback(errTx, null);

            // 1. Descuenta stock y espera cada consulta antes de continuar.
            function actualizarStock(indice) {
                if (indice >= itemsVerificados.length) {
                    return registrarMovimiento();
                }

                const item = itemsVerificados[indice];
                db.query(
                    'UPDATE producto SET cantidad = cantidad - ?, fecha_modificacion = NOW() WHERE id = ?',
                    [item.cantidad, item.producto_id],
                    (errStock) => {
                        if (errStock) return db.rollback(() => callback(errStock, null));
                        actualizarStock(indice + 1);
                    }
                );
            }

            // 2. Registra movimiento financiero (ingreso)
            function registrarMovimiento() {
                db.query(
                    `INSERT INTO movimiento_financiero (tipo_movimiento, monto, fecha, descripcion, referencia_paypal)
                     VALUES ('ingreso', ?, NOW(), ?, ?)`,
                    [total, `Venta PayPal (${orden_paypal_id}) - ${nombre_cliente}`, orden_paypal_id],
                    (errMov) => {
                        if (errMov) return db.rollback(() => callback(errMov, null));

                    // 3. Genera Factura Electronica XML CFDI 4.0
                    const facturaXML = generarFacturaXML({
                        folio: 'CFDI-' + Date.now().toString().slice(-6),
                        subtotal,
                        iva,
                        total,
                        cliente: { nombre: nombre_cliente, correo: correo_cliente },
                        detalle: itemsVerificados
                    });

                    // 4. Inserta en factura
                    db.query(
                        `INSERT INTO factura (cliente_id, orden_paypal_id, fecha_emision, archivo_xml)
                         VALUES (?, ?, NOW(), ?)`,
                        [cliente_id || null, orden_paypal_id, facturaXML.xml],
                        (errFac, resFac) => {
                            if (errFac) return db.rollback(() => callback(errFac, null));

                            db.commit((errCommit) => {
                                if (errCommit) return db.rollback(() => callback(errCommit, null));

                                const folioGenerado = resFac.insertId;
                                callback(null, {
                                    id: folioGenerado,
                                    folio: folioGenerado,
                                    total,
                                    iva,
                                    archivo_xml: facturaXML.xml,
                                    orden_paypal_id
                                });
                            });
                        }
                    );
                    }
                );
            }

            actualizarStock(0);
        });
    });
}

function obtenerFacturaPorVenta(folio, clienteId, callback) {
    let sql = 'SELECT * FROM factura WHERE (id::text = ? OR orden_paypal_id = ?)';
    const parametros = [String(folio), String(folio)];

    if (clienteId) {
        sql += ' AND cliente_id = ?';
        parametros.push(clienteId);
    }

    db.query(sql, parametros, (error, rows) => {
        if (error) return callback(error, null);
        callback(null, rows[0] || null);
    });
}

module.exports = {
    obtenerResumenVentas,
    obtenerVentas,
    validarStockOrden,
    crearVenta,
    obtenerFacturaPorVenta
};