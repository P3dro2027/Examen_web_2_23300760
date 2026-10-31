import { Injectable } from '@angular/core';
import { CallbackHttp, postJSON } from './http-cliente';

@Injectable({
  providedIn: 'root'
})
export class PaypalService {
  private readonly url = 'http://localhost:3000/api/paypal';

  // Crea la orden en PayPal pasando productos y datos fiscales del cliente
  crearOrden(datos: any, callback: CallbackHttp): void {
    postJSON(`${this.url}/orden`, datos, callback);
  }

  // Captura la orden de PayPal cuando el cliente aprueba el pago
  capturarOrden(datosOId: any, callback: CallbackHttp): void {
    const ordenId = typeof datosOId === 'string' ? datosOId : (datosOId?.orderID || datosOId?.orderId);
    postJSON(`${this.url}/capturar/${ordenId}`, typeof datosOId === 'object' ? datosOId : {}, callback);
  }
}
