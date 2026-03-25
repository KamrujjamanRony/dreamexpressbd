import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SAuth } from '../services/s-auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(SAuth);
    const router = inject(Router);
    const userInfo = authService.getUser();

    // Add Authorization header if token exists
    if (userInfo?.token) {
        req = req.clone({
            setHeaders: { Authorization: `Bearer ${userInfo.token}` }
        });
    }

    // Handle the response and check for 401 errors
    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                // Clear user data and navigate to login
                authService.deleteUser();
                router.navigate(['/admin-login']);
            }
            return throwError(() => error);
        })
    );
};
