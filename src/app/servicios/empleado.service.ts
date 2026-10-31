import { Injectable } from '@angular/core';
import { CallbackHttp, obtenerJSON, postJSON, putJSON, eliminarJSON } from './http-cliente';

@Injectable({ providedIn: 'root' })
export class EmpleadoService {
  private readonly url = 'http://localhost:3000/api/empleados';

  obtenerEmpleados(callback: CallbackHttp): void {
    obtenerJSON(this.url, callback);
  }

  agregarEmpleado(datos: any, callback: CallbackHttp): void {
    postJSON(this.url, datos, callback);
  }

  editarEmpleado(id: number, datos: any, callback: CallbackHttp): void {
    putJSON(`${this.url}/${id}`, datos, callback);
  }

  eliminarEmpleado(id: number, callback: CallbackHttp): void {
    eliminarJSON(`${this.url}/${id}`, callback);
  }

  registrarAsistencia(id: number, datos: any, callback: CallbackHttp): void {
    postJSON(`${this.url}/${id}/asistencia`, datos, callback);
  }

  generarNomina(id: number, datos: any, callback: CallbackHttp): void {
    postJSON(`${this.url}/${id}/nomina`, datos, callback);
  }
}
