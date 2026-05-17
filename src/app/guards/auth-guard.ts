import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SAuth } from '../services/s-auth';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(SAuth);
  const router: Router = inject(Router);
  const userInfo = auth.getUser();
  if (userInfo) {
    return true;
  } else {
    router.navigate(['/admin-login']);
    return false;
  }
};