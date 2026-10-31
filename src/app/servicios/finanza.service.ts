import { Injectable } from '@angular/core';
import { CallbackHttp, obtenerJSON, postJSON } from './http-cliente';

@Injectable({ providedIn: 'root' })
export class FinanzaService {
  private readonly url = 'http://localhost:3000/api/finanzas';

  obtenerResumen(callback: CallbackHttp): void {
    obtenerJSON(`${this.url}/resumen`, callback);
  }

  obtenerGrafica(callback: CallbackHttp): void {
    obtenerJSON(`${this.url}/grafica`, callback);
  }

  obtenerReportes(callback: CallbackHttp): void {
    obtenerJSON(`${this.url}/reportes`, callback);
  }

  registrarMovimiento(datos: any, callback: CallbackHttp): void {
    postJSON(`${this.url}/movimiento`, datos, callback);
  }
}
