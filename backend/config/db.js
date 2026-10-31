const { Client, types } = require('pg');

// COUNT/SUM enteros llegan como bigint (texto): se convierten a numero.
types.setTypeParser(20, (valor) => parseInt(valor, 10));

const conexion = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'cafeteria'
});

conexion.connect((error) => {
    if (error) {
        console.error('Error de conexión:', error.message);
        return;
    }
    console.log('Conectado a PostgreSQL');
});

conexion.on('error', (error) => {
    console.error('Error en la conexión a PostgreSQL:', error.message);
});

// Cambia los ? por $1, $2... (formato de PostgreSQL), ignorando textos entre comillas.
function convertirMarcadores(sql) {
    let indice = 0;
    let dentroDeTexto = false;
    let resultado = '';
    for (const caracter of sql) {
        if (caracter === "'") dentroDeTexto = !dentroDeTexto;
        if (caracter === '?' && !dentroDeTexto) {
            indice += 1;
            resultado += '$' + indice;
        } else {
            resultado += caracter;
        }
    }
    return resultado;
}

// Misma forma de uso que antes: db.query(sql, [parametros], (error, resultado) => {...})
//  - SELECT  -> resultado es el arreglo de filas
//  - INSERT  -> resultado.insertId trae el id generado (se agrega RETURNING id)
//  - UPDATE / DELETE -> resultado.affectedRows
function query(sql, parametros, callback) {
    if (typeof parametros === 'function') {
        callback = parametros;
        parametros = [];
    }

    let texto = convertirMarcadores(sql).trim();
    const esInsert = /^INSERT\b/i.test(texto);
    if (esInsert && !/\bRETURNING\b/i.test(texto)) {
        texto += ' RETURNING id';
    }

    conexion.query(texto, parametros || [], (error, res) => {
        if (error) return callback(error);

        if (esInsert) {
            return callback(null, {
                insertId: res.rows[0] ? res.rows[0].id : null,
                affectedRows: res.rowCount
            });
        }
        if (/^(UPDATE|DELETE)\b/i.test(texto)) {
            return callback(null, { affectedRows: res.rowCount });
        }
        callback(null, res.rows);
    });
}

function ejecutarSimple(sql, callback) {
    conexion.query(sql, (error) => callback(error || null));
}

module.exports = {
    query,
    beginTransaction: (callback) => ejecutarSimple('BEGIN', callback),
    commit: (callback) => ejecutarSimple('COMMIT', callback),
    rollback: (callback) => ejecutarSimple('ROLLBACK', () => callback && callback())
};
