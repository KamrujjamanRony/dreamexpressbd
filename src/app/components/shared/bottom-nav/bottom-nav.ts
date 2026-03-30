import { Component, inject, signal, DestroyRef } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { SCart } from '../../../services/s-cart';
import { SAuthCookie } from '../../../services/s-auth-cookie';

@Component({
    selector: 'app-bottom-nav',
    imports: [RouterLink],
    templateUrl: './bottom-nav.html',
    styleUrl: './bottom-nav.css',
})
export class BottomNav {
    private cartService = inject(SCart);
    private authCookie = inject(SAuthCookie);
    private router = inject(Router);
    private destroyRef = inject(DestroyRef);

    totalCarts = signal(0);
    activeTab = signal('home');

    ngOnInit() {
        this.refreshCartCount();
        this.cartService.cartUpdated$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            this.refreshCartCount();
        });

        this.updateActiveTab(this.router.url);
        this.router.events.pipe(
            filter(e => e instanceof NavigationEnd),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe((e: NavigationEnd) => {
            this.updateActiveTab(e.urlAfterRedirects);
        });
    }

    private refreshCartCount() {
        this.totalCarts.set(this.cartService.cartCount());
    }

    private updateActiveTab(url: string) {
        if (url.startsWith('/shop')) this.activeTab.set('shop');
        else if (url.startsWith('/home') || url === '/') this.activeTab.set('home');
        else if (url.startsWith('/cart')) this.activeTab.set('cart');
        else if (url.startsWith('/account') || url.startsWith('/login')) this.activeTab.set('account');
        else this.activeTab.set('');
    }

    get accountRoute(): string {
        return this.authCookie.isCustomer() ? '/account/profile' : '/login';
    }
}
