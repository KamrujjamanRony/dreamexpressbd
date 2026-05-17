import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, tap, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class SGuest {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = environment.apiUrl;
    private readonly STORAGE_KEY = 'guest_token_data';
    private initRequest$: Observable<any> | null = null;

    /** Call on app init to fetch and store guest token (non-blocking) */
    initialize(): Observable<any> {
        const existing = this.getStoredData();
        if (existing && new Date(existing.expiration) > new Date()) {
            return of(existing);
        }
        if (!this.initRequest$) {
            this.initRequest$ = this.http
                .post<any>(
                    `${this.apiUrl}/Authentication/guest-token?companyId=${environment.companyCode}`,
                    {}
                )
                .pipe(
                    map((response) => response?.data ?? response),
                    tap((data) => sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))),
                    shareReplay(1)
                );
        }
        return this.initRequest$;
    }

    getToken(): string | null {
        return this.getStoredData()?.['g-token'] || null;
    }

    getGuestId(): string | null {
        return this.getStoredData()?.guestId || null;
    }

    private getStoredData(): any {
        const data = sessionStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    }
}
