const PAYPAL_API_URL = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';

function obtenerCredenciales() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    return { clientId, clientSecret };
}

async function obtenerToken() {
    const { clientId, clientSecret } = obtenerCredenciales();
    const respuesta = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });

    const datos = await respuesta.json();
    if (!respuesta.ok || !datos.access_token) {
        throw new Error(datos.error_description || 'No se pudo autenticar con PayPal Sandbox');
    }

    return datos.access_token;
}

async function solicitarPayPal(ruta, opciones = {}) {
    const token = await obtenerToken();
    const respuesta = await fetch(`${PAYPAL_API_URL}${ruta}`, {
        ...opciones,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...(opciones.headers || {})
        }
    });

    const datos = await respuesta.json();
    if (!respuesta.ok) {
        const detalle = datos.details?.[0]?.description;
        throw new Error(detalle || datos.message || 'PayPal rechazó la solicitud');
    }

    return datos;
}

function crearOrdenPayPal(datos, callback) {
    const totalNum = Number(datos.total);

    if (!Number.isFinite(totalNum) || totalNum <= 0) {
        return callback(new Error('Total invalido para PayPal'));
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

    const orden = {
        intent: 'CAPTURE',
        application_context: {
            return_url: `${frontendUrl}/carrito`,
            cancel_url: `${frontendUrl}/carrito?cancel=true`
        },
        purchase_units: [{
            amount: {
                currency_code: 'MXN',
                value: totalNum.toFixed(2)
            },
            description: 'Compra en ERP Cafetería'
        }]
    };

    solicitarPayPal('/v2/checkout/orders', {
        method: 'POST',
        headers: {
            Prefer: 'return=representation'
        },
        body: JSON.stringify(orden)
    })
        .then(respuesta => callback(null, {
            id: respuesta.id,
            status: respuesta.status,
            total: respuesta.purchase_units?.[0]?.amount?.value || totalNum.toFixed(2),
            approveUrl: respuesta.links?.find(link => link.rel === 'payer-action' || link.rel === 'approve')?.href || null
        }))
        .catch(error => callback(error));
}

function capturarOrdenPayPal(orderId, callback) {
    if (!orderId) {
        return callback(new Error('ID de orden PayPal no proporcionado'));
    }

    solicitarPayPal(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
        method: 'POST',
        headers: {
            Prefer: 'return=representation'
        },
        body: '{}'
    })
        .then(respuesta => {
            const capturas = respuesta.purchase_units?.flatMap(u => u.payments?.captures || []) || [];
            const captura = capturas.find(c => c.status === 'COMPLETED') || capturas[0] || respuesta.purchase_units?.[0]?.payments?.captures?.[0];
            const estadoCaptura = captura?.status;

            // Valida estado completado o pendiente en sandbox
            const esValido = respuesta.status === 'COMPLETED' || estadoCaptura === 'COMPLETED' || estadoCaptura === 'PENDING';

            callback(null, {
                estado: esValido ? 'APROBADO' : 'RECHAZADO',
                transaccionId: captura?.id || orderId,
                mensaje: estadoCaptura === 'PENDING'
                    ? 'Pago procesado (en retención preventiva de 24h por PayPal Sandbox)'
                    : 'Pago aprobado y capturado exitosamente'
            });
        })
        .catch(error => callback(error));
}

module.exports = {
    crearOrdenPayPal,
    capturarOrdenPayPal
};
