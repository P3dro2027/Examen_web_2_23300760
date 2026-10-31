// Generador de factura electrónica en formato XML (estándar CFDI 4.0)
const crypto = require('crypto');

function generarUUID() {
    return crypto.randomUUID();
}

function formatearFecha(fecha = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    const y = fecha.getFullYear();
    const m = pad(fecha.getMonth() + 1);
    const d = pad(fecha.getDate());
    const h = pad(fecha.getHours());
    const min = pad(fecha.getMinutes());
    const s = pad(fecha.getSeconds());
    return `${y}-${m}-${d}T${h}:${min}:${s}`;
}

function escaparXML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function generarFacturaXML(datos) {
    const {
        folio,
        fecha = new Date(),
        subtotal,
        iva,
        total,
        cliente = {},
        detalle = []
    } = datos;

    const uuid = generarUUID();
    const fechaISO = formatearFecha(fecha);
    const subtotalFmt = Number(subtotal).toFixed(2);
    const ivaFmt = Number(iva).toFixed(2);
    const totalFmt = Number(total).toFixed(2);

    const rfcReceptor = escaparXML(cliente.rfc || 'XAXX010101000');
    const nombreReceptor = escaparXML(cliente.nombre || 'PUBLICO EN GENERAL');
    const correoReceptor = escaparXML(cliente.correo || 'cliente@cafeteria.com');

    let conceptosXML = '';
    for (const item of detalle) {
        const cant = Number(item.cantidad || 1);
        const precioUnit = Number(item.precio_unitario || 0);
        const importeItem = (cant * precioUnit).toFixed(2);
        const ivaItem = (cant * precioUnit * 0.16).toFixed(2);
        const descripcion = escaparXML(item.nombre || `Producto #${item.producto_id}`);

        conceptosXML += `
    <cfdi:Concepto ClaveProdServ="50201700" Cantidad="${cant}" ClaveUnidad="H87" Unidad="Pieza" Descripcion="${descripcion}" ValorUnitario="${precioUnit.toFixed(2)}" Importe="${importeItem}">
      <cfdi:Impuestos>
        <cfdi:Traslados>
          <cfdi:Traslado Base="${importeItem}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${ivaItem}"/>
        </cfdi:Traslados>
      </cfdi:Impuestos>
    </cfdi:Concepto>`;
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" Version="4.0" Serie="ERP" Folio="${folio}" Fecha="${fechaISO}" FormaPago="01" MetodoPago="PUE" TipoDeComprobante="I" Moneda="MXN" SubTotal="${subtotalFmt}" Total="${totalFmt}" LugarExpedicion="01000" Exportacion="01">
  <cfdi:Emisor Rfc="CAFE240101XYZ" Nombre="CAFETERIA ERP SISTEMAS S.A. DE C.V." RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="${rfcReceptor}" Nombre="${nombreReceptor}" DomicilioFiscalReceptor="01000" RegimenFiscalReceptor="616" UsoCFDI="G03" Email="${correoReceptor}"/>
  <cfdi:Conceptos>${conceptosXML}
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="${ivaFmt}">
    <cfdi:Traslados>
      <cfdi:Traslado Base="${subtotalFmt}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${ivaFmt}"/>
    </cfdi:Traslados>
  </cfdi:Impuestos>
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" Version="1.1" UUID="${uuid}" FechaTimbrado="${fechaISO}" RfcProvCertif="SAT970701NN3" SelloCFD="aB7c...M==" NoCertificadoSAT="00001000000504465028"/>
  </cfdi:Complemento>
</cfdi:Comprobante>`;

    return {
        xml,
        uuid
    };
}

module.exports = {
    generarFacturaXML
};
