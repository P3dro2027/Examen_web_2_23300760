import { Injectable } from '@angular/core';
import { CallbackHttp, obtenerJSON, postJSON } from './http-cliente';

@Injectable({ providedIn: 'root' })
export class VentaService {
  private readonly url = 'http://localhost:3000/api/ventas';

  obtenerResumen(callback: CallbackHttp): void {
    obtenerJSON(`${this.url}/resumen`, callback);
  }

  obtenerVentas(callback: CallbackHttp, clienteId?: number): void {
    const query = clienteId ? `?cliente_id=${clienteId}` : '';
    obtenerJSON(`${this.url}${query}`, callback);
  }

  crearVenta(datos: any, callback: CallbackHttp): void {
    postJSON(this.url, datos, callback);
  }

  obtenerFactura(id: number, callback: CallbackHttp, clienteId?: number | null): void {
    const query = clienteId ? `?cliente_id=${clienteId}` : '';
    obtenerJSON(`${this.url}/${id}/factura${query}`, callback);
  }
}