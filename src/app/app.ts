import { ChangeDetectionStrategy, Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { Router, RouterOutlet, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../environments/environment';
import { Toast } from './utils/toast/toast';
import { Confirm } from "./utils/confirm/confirm";
import { SocialChat } from "./utils/social-chat/social-chat";
import { CartDrawer } from "./utils/cart-drawer/cart-drawer";
import { SSeo } from './services/s-seo';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast, Confirm, SocialChat, CartDrawer],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private seo = inject(SSeo);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  protected readonly title = signal(environment.companyName);
  protected readonly routeLoading = signal(false);

  ngOnInit() {
    this.seo.init();
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(event => {
      if (event instanceof NavigationStart) {
        this.routeLoading.set(true);
      } else if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
        this.routeLoading.set(false);
      }
    });
  }
}
