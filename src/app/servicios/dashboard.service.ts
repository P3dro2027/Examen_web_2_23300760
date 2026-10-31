import { Injectable } from '@angular/core';
import { CallbackHttp, obtenerJSON } from './http-cliente';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly url = 'http://localhost:3000/api/dashboard';

  obtenerResumen(callback: CallbackHttp): void {
    obtenerJSON(this.url, callback);
  }
}
