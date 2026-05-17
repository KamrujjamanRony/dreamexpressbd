import { inject, Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SAuthCookie {
  cookieService = inject(CookieService);

  private userChangedSource = new Subject<any>();
  userChanged$ = this.userChangedSource.asObservable();

  login(userData: any) {
    // Normalize PascalCase token field from .NET API response
    const normalized = {
      ...userData,
      token: userData?.token || userData?.Token || null,
    };
    this.cookieService.set('userData', JSON.stringify(normalized), 7, '/');
    this.userChangedSource.next(normalized);
  }

  getUserData() {
    const userData = this.cookieService.get('userData');
    return userData ? JSON.parse(userData) : null;
  }

  saveCheckoutAddress(addressData: any) {
    this.cookieService.set('checkoutAddress', JSON.stringify(addressData), 30, '/');
  }

  getCheckoutAddress() {
    const addressData = this.cookieService.get('checkoutAddress');
    return addressData ? JSON.parse(addressData) : null;
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
    this.userChangedSource.next(null);
  }

}
