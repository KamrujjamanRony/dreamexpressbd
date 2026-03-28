import { inject, Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root',
})
export class SAuthCookie {
  cookieService = inject(CookieService);

  login(userData: any) {
    // Normalize PascalCase token field from .NET API response
    const normalized = {
      ...userData,
      token: userData?.token || userData?.Token || null,
    };
    this.cookieService.set('userData', JSON.stringify(normalized), 7, '/');
  }

  getUserData() {
    const userData = this.cookieService.get('userData');
    return userData ? JSON.parse(userData) : null;
  }

  getToken(): string | null {
    return this.getUserData()?.token || null;
  }

  isCustomer(): boolean {
    return !!this.getUserData();
  }

  logout() {
    // Delete the user data cookie
    this.cookieService.delete('userData', '/');
  }

}
