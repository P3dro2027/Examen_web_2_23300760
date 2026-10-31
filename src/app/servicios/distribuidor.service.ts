import { Injectable } from '@angular/core';
import { CallbackHttp, obtenerJSON, postJSON, putJSON, eliminarJSON } from './http-cliente';

@Injectable({ providedIn: 'root' })
export class DistribuidorService {
  private readonly url = 'http://localhost:3000/api/distribuidores';

  obtenerDistribuidores(callback: CallbackHttp): void {
    obtenerJSON(this.url, callback);
  }

  agregarDistribuidor(datos: { nombre: string }, callback: CallbackHttp): void {
    postJSON(this.url, datos, callback);
  }

  editarDistribuidor(id: number, datos: { nombre: string }, callback: CallbackHttp): void {
    putJSON(`${this.url}/${id}`, datos, callback);
  }

  eliminarDistribuidor(id: number, callback: CallbackHttp): void {
    eliminarJSON(`${this.url}/${id}`, callback);
  }
}
