import { inject, Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root',
})
export class SAuthCookie {
  cookieService = inject(CookieService);

  login(userData: any) {
    // Save user data in cookie with a 7-day expiration
    this.cookieService.set('userData', JSON.stringify(userData), 7, '/');
  }

  getUserData() {
    const userData = this.cookieService.get('userData');
    return userData ? JSON.parse(userData) : null;
  }

  logout() {
    // Delete the user data cookie
    this.cookieService.delete('userData', '/');
  }
  
}
