import { inject, Injectable } from '@angular/core';
import { SAuthCookie } from './s-auth-cookie';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class SAuthUser {
  authCookieService = inject(SAuthCookie);
  router = inject(Router);
  public currentUser: any = null;

  get(callback?: (user: any) => void) {
    const user = this.authCookieService.getUserData();
    this.currentUser = user;
    if (callback) callback(user);
  }

  getUserData(): any {
    return this.authCookieService.getUserData();
  }

  isLoggedIn(): boolean {
    const user = this.authCookieService.getUserData();
    return !!user;
  }

  logout() {
    this.authCookieService.logout();
    this.currentUser = null;
    this.router.navigate(['/']);
  }

}
