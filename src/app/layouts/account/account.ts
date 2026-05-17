import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SAuthCookie } from '../../services/s-auth-cookie';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faUser,
  faBoxOpen,
  faTruckFast,
  faArrowRightFromBracket,
  faBars,
  faXmark,
  faHeart,
  faCartShopping,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-account',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FontAwesomeModule],
  templateUrl: './account.html',
  styleUrl: './account.css',
})
export class Account {
  private authCookie = inject(SAuthCookie);
  private router = inject(Router);

  faUser = faUser;
  faBoxOpen = faBoxOpen;
  faTruckFast = faTruckFast;
  faLogout = faArrowRightFromBracket;
  faBars = faBars;
  faXmark = faXmark;
  faHeart = faHeart;
  faCartShopping = faCartShopping;

  sidebarOpen = signal(false);

  get user() {
    return this.authCookie.getUserData();
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  logout(): void {
    this.authCookie.logout();
    this.router.navigate(['/login']);
  }
}
