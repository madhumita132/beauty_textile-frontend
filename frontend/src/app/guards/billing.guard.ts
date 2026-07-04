import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Allows both ADMIN and BILLING roles to access the billing/POS route.
 * All other admin routes remain ADMIN-only via authGuard.
 */
export const billingGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (!auth.hasToken()) {
    router.navigate(['/admin/login']);
    return false;
  }
  return true;   // both ADMIN and BILLING can access billing
};
