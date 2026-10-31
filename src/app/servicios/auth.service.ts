import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CallbackHttp, postJSON } from './http-cliente';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly url = 'http://localhost:3000/api/sesion';

  constructor(private router: Router) {}

  iniciarSesion(correo: string, contrasena: string, callback: CallbackHttp): void {
    postJSON(`${this.url}/login`, { correo, contrasena }, (error, data) => {
      if (error) {
        callback(error, null);
        return;
      }
      if (data && data.existe) {
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        localStorage.setItem('rol', data.rol);
        localStorage.setItem('usuarioId', String(data.usuario.id));
        localStorage.setItem('usuarioCorreo', data.usuario.correo || '');
        callback(null, data);
      } else {
        callback({ mensaje: data?.mensaje || 'Credenciales incorrectas' }, null);
      }
    });
  }

  registrarCliente(datos: any, callback: CallbackHttp): void {
    postJSON(`${this.url}/registro`, datos, callback);
  }

  estaAutenticado(): boolean {
    return !!localStorage.getItem('rol') && !!localStorage.getItem('token');
  }

  esAdmin(): boolean {
    return localStorage.getItem('rol') === 'administrador';
  }

  esCliente(): boolean {
    return localStorage.getItem('rol') === 'cliente';
  }

  obtenerNombre(): string {
    return localStorage.getItem('usuarioCorreo') || 'Usuario';
  }

  obtenerUsuarioId(): number | null {
    const id = localStorage.getItem('usuarioId');
    return id ? Number(id) : null;
  }

  guardarToken(token: string, rol: string): void {
    localStorage.setItem('token', token);
    localStorage.setItem('rol', rol);
  }

  obtenerToken(): string | null {
    return localStorage.getItem('token');
  }

  obtenerRol(): string | null {
    return localStorage.getItem('rol');
  }

  tieneRol(rolesPermitidos: string[]): boolean {
    const rol = this.obtenerRol();
    return rol !== null && rolesPermitidos.includes(rol);
  }

  cerrarSesion(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('usuarioId');
    localStorage.removeItem('usuarioCorreo');
    this.router.navigate(['/']);
  }
}
