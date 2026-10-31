const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const { manejarErrores } = require('./middleware/auth');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/productos', require('./routes/producto.routes'));
app.use('/api/distribuidores', require('./routes/distribuidor.routes'));
app.use('/api/ventas', require('./routes/venta.routes'));
app.use('/api/empleados', require('./routes/empleado.routes'));
app.use('/api/finanzas', require('./routes/finanza.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/sesion', require('./routes/sesion.routes'));
app.use('/api/paypal', require('./routes/paypal.routes'));
app.use(manejarErrores);

app.listen(3000, () => {
    console.log('Servidor ejecutandose en http://localhost:3000');
});
