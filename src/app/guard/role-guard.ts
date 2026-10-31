import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../servicios/auth.service';

// Guardian de permisos y roles: valida contra data['roles']
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const rolesPermitidos = (route.data?.['roles'] as string[]) ?? [];

  if (!authService.estaAutenticado()) {
    return router.createUrlTree(['/']);
  }

  // Si no se especificaron roles o el usuario tiene el rol permitido, permitir acceso
  if (rolesPermitidos.length === 0 || authService.tieneRol(rolesPermitidos)) {
    return true;
  }

  // Si está autenticado pero no tiene permisos para la sección (ej. cliente intentando entrar a admin)
  return router.createUrlTree(['/compras']);
};

// Mantener alias por compatibilidad
export const roleguard = roleGuard;
