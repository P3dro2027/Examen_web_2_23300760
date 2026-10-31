import { Component, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { validarCorreo, validarTexto } from '../../servicios/http-cliente';

@Component({
  imports: [],
  selector: 'app-sesion',
  styleUrl: './sesion.css',
  templateUrl: './sesion.html',
})
export class Sesion {
  mostrarRegistro = false;
  cargando = false;
  mensajeError = '';

  correo = '';
  contrasena = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  alternarVista(): void {
    this.mostrarRegistro = !this.mostrarRegistro;
    this.mensajeError = '';
    this.cdr.detectChanges();
  }

  enviar(): void {
    if (this.cargando) return;
    this.mensajeError = '';

    const errCorreo = validarCorreo(this.correo);
    if (errCorreo) {
      this.mensajeError = errCorreo;
      return;
    }

    const errContrasena = validarTexto(this.contrasena, 100);
    if (errContrasena) {
      this.mensajeError = `Contraseña: ${errContrasena}`;
      return;
    }

    if (this.mostrarRegistro) {
      this.cargando = true;
      this.authService.registrarCliente(
        { correo: this.correo, contrasena: this.contrasena },
        (error) => {
          this.cargando = false;
          if (error) {
            this.mensajeError = error.mensaje || 'No se pudo registrar la cuenta';
            this.cdr.detectChanges();
            return;
          }
          this.mostrarRegistro = false;
          this.cdr.detectChanges();
        }
      );
      return;
    }

    this.cargando = true;
    this.authService.iniciarSesion(this.correo, this.contrasena, (error, resultado) => {
      this.cargando = false;
      if (error) {
        this.mensajeError = error.mensaje || 'Error al iniciar sesión';
        this.cdr.detectChanges();
        return;
      }

      if (resultado && resultado.existe) {
        this.router.navigate([resultado.rol === 'administrador' ? '/dashboard' : '/compras']);
      } else {
        this.mensajeError = 'Correo o contraseña incorrectos';
        this.cdr.detectChanges();
      }
    });
  }
}