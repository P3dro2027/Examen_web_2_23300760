import { Routes } from '@angular/router';
import { Dashboard } from './componentes/dashboard/dashboard';
import { Sesion } from './componentes/sesion/sesion';
import { Finanzas } from './componentes/pagina/finanzas/finanzas';
import { Inventario } from './componentes/pagina/inventario/inventario';
import { Rh } from './componentes/pagina/rh/rh';
import { Ventas } from './componentes/pagina/ventas/ventas';
import { Carrito } from './componentes/pagina/carrito/carrito';
import { authGuard } from './guard/auth-guard';
import { roleGuard } from './guard/role-guard';

export const routes: Routes = [
  { path: '', component: Sesion },
  { path: 'login', redirectTo: '' },
  { 
    path: 'dashboard', 
    component: Dashboard, 
    canActivate: [authGuard, roleGuard], 
    data: { roles: ['administrador'] }
  },
  { 
    path: 'finanzas', 
    component: Finanzas, 
    canActivate: [authGuard, roleGuard], 
    data: { roles: ['administrador'] }
  },
  { 
    path: 'inventario', 
    component: Inventario, 
    canActivate: [authGuard, roleGuard], 
    data: { roles: ['administrador'] } 
  },
  {
    path: 'compras',
    component: Carrito,
    canActivate: [authGuard, roleGuard], 
    data: { roles: ['administrador', 'cliente'] }
  },
  { 
    path: 'rh', 
    component: Rh, 
    canActivate: [authGuard, roleGuard], 
    data: { roles: ['administrador'] } 
  },
  { 
    path: 'ventas', 
    component: Ventas, 
    canActivate: [authGuard, roleGuard], 
    data: { roles: ['administrador', 'cliente'] } 
  }, 
  { path: 'carrito', redirectTo: 'compras' },
  { path: 'pago-paypal', redirectTo: 'compras' },
  { path: 'checkout', redirectTo: 'compras' },
  { path: '**', redirectTo: '' }
];
