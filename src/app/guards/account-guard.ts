import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const accountGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');

  if (!userInfo || !userInfo.token) {
    router.navigate(['/account/login'], { queryParams: { returnUrl: router.url } });
    return false;
  }
  return true;
};
