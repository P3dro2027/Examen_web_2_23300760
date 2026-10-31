import { Injectable } from '@angular/core';
import { CallbackHttp, obtenerJSON, postJSON, putJSON, eliminarJSON } from './http-cliente';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly url = 'http://localhost:3000/api/productos';

  obtenerProductos(callback: CallbackHttp): void {
    obtenerJSON(this.url, callback);
  }

  agregarProducto(datos: any, callback: CallbackHttp): void {
    postJSON(this.url, datos, callback);
  }

  editarProducto(id: number, datos: any, callback: CallbackHttp): void {
    putJSON(`${this.url}/${id}`, datos, callback);
  }

  eliminarProducto(id: number, callback: CallbackHttp): void {
    eliminarJSON(`${this.url}/${id}`, callback);
  }
}
