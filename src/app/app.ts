import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './servicios/auth.service';
import { LegalService } from './servicios/legal.service';
import { CarritoService } from './servicios/carrito.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Prac1ERP');
  mostrarLayout = signal(false);

  private router = inject(Router);
  private authService = inject(AuthService);
  public legalService = inject(LegalService);
  private carritoService = inject(CarritoService);

  constructor() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const url = event.urlAfterRedirects || event.url;
      const esLogin = url === '/' || url === '';

      if (esLogin) {
        this.mostrarLayout.set(false);
        if (this.authService.estaAutenticado()) {
          this.router.navigate([this.authService.esAdmin() ? '/dashboard' : '/compras']);
        }
      } else {
        this.mostrarLayout.set(this.authService.estaAutenticado());
      }
    });
  }

  esAdmin(): boolean {
    return this.authService.esAdmin();
  }

  cerrarSesion(): void {
    this.carritoService.vaciar();
    this.authService.cerrarSesion();
    this.mostrarLayout.set(false);
  }
}
