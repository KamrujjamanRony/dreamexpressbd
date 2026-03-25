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

  get(data: any) {
    // this.auth.onAuthStateChanged((user) => {
    //   data = user;
    // });
  }

  isLoggedIn(): boolean {
    const user = this.authCookieService.getUserData();
    return !!user;
    // return !!this.auth.currentUser;
  }

  register(email: any, password: any) {
    // return createUserWithEmailAndPassword(this.auth, email, password);
  }
  
  forgotPassword(email: string) {
    // return sendPasswordResetEmail(this.auth, email);
  }
  
  logout() {
    this.authCookieService.logout();
    this.router.navigate(['/']);
    // return signOut(this.auth);
  }
  
}
