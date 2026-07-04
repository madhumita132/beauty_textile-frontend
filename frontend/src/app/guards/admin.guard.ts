import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Blocks BILLING-role users from accessing admin-only routes.
 * Redirects them to /admin/billing instead.
 */
export const adminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (!auth.hasToken()) {
    router.navigate(['/admin/login']);
    return false;
  }
  if (!auth.isAdmin()) {
    router.navigate(['/admin/billing']);
    return false;
  }
  return true;
};
