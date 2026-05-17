import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, throwError } from 'rxjs';
import { SAuth } from '../services/s-auth';
import { SGuest } from '../services/s-guest';
import { SAuthCookie } from '../services/s-auth-cookie';

/**
 * Checks if a response body is the new API wrapper format: { success, message, data }
 */
function isApiWrapper(body: any): boolean {
    return body != null && typeof body === 'object' && 'success' in body && 'data' in body;
}

/**
 * Formats an API error body ({ success, message, errorCode, details }) into a readable string.
 */
function formatApiError(errorBody: any): string {
    if (errorBody != null && typeof errorBody === 'object' && errorBody.message) {
        return errorBody.details
            ? `${errorBody.message} : ${errorBody.details}`
            : errorBody.message;
    }
    return 'An unexpected error occurred';
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(SAuth);
    const guestService = inject(SGuest);
    const authCookie = inject(SAuthCookie);
    const router = inject(Router);

    // Skip token for guest-token endpoint (bootstrap request)
    if (req.url.includes('guest-token')) {
        return next(req);
    }

    const adminToken = authService.getUser()?.token;
    const customerToken = authCookie.getToken();
    const guestToken = guestService.getToken();
    const isAdminArea = router.url.includes('/admin');

    // Priority: admin area → admin token, customer logged in → customer token, fallback → guest token
    let token: string | null = null;
    if (isAdminArea) {
        token = adminToken || null;
    } else if (customerToken) {
        token = customerToken;
    } else {
        token = guestToken || null;
    }

    if (token) {
        req = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
        });
    }

    return next(req).pipe(
        // Unwrap { success, message, data } → data
        map(event => {
            if (event instanceof HttpResponse && isApiWrapper(event.body)) {
                return event.clone({ body: (event.body as any).data });
            }
            return event;
        }),
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                if (isAdminArea) {
                    authService.deleteUser();
                    router.navigate(['/admin-login']);
                } else {
                    authCookie.logout();
                    router.navigate(['/login']);
                }
            }

            // Format API error body into readable message
            const apiMessage = formatApiError(error.error);
            const formattedError = new HttpErrorResponse({
                error: apiMessage,
                headers: error.headers,
                status: error.status,
                statusText: error.statusText,
                url: error.url ?? undefined,
            });
            return throwError(() => formattedError);
        })
    );
};
