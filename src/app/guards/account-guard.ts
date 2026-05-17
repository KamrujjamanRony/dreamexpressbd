import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SAuthCookie } from '../services/s-auth-cookie';

export const accountGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authCookie = inject(SAuthCookie);
  const userData = authCookie.getUserData();

  if (!userData) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};
