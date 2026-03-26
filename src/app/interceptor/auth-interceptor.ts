import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SAuth } from '../services/s-auth';
import { SGuest } from '../services/s-guest';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(SAuth);
    const guestService = inject(SGuest);
    const router = inject(Router);

    // Skip token for guest-token endpoint (bootstrap request)
    if (req.url.includes('guest-token')) {
        return next(req);
    }

    const adminToken = authService.getUser()?.token;
    const guestToken = guestService.getToken();
    const isAdminArea = router.url.includes('/admin');

    // Priority: admin token for admin area, else guest token for all public/account routes
    let token: string | null = null;
    if (isAdminArea && adminToken) {
        token = adminToken;
    } else if (guestToken) {
        token = guestToken;
    } else if (adminToken) {
        token = adminToken;
    }

    if (token) {
        req = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
        });
    }

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401 && isAdminArea) {
                authService.deleteUser();
                router.navigate(['/admin-login']);
            }
            return throwError(() => error);
        })
    );
};
