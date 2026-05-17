import { ChangeDetectionStrategy, Component, inject, signal, DestroyRef, ViewChild } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { SCart } from '../../../services/s-cart';
import { SearchOverlay } from '../search-overlay/search-overlay';
import { CartDrawerService } from '../../../utils/cart-drawer/cart-drawer.service';

@Component({
    selector: 'app-bottom-nav',
    imports: [RouterLink, SearchOverlay],
    templateUrl: './bottom-nav.html',
    styleUrl: './bottom-nav.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomNav {
    private router = inject(Router);
    private cartService = inject(SCart);
    private cartDrawer = inject(CartDrawerService);
    private destroyRef = inject(DestroyRef);

    @ViewChild('searchOverlay') searchOverlay!: SearchOverlay;

    activeTab = signal('home');
    totalCarts = signal(0);

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

    private updateActiveTab(url: string) {
        if (url.startsWith('/shop')) this.activeTab.set('shop');
        else if (url.startsWith('/home') || url === '/') this.activeTab.set('home');
        else if (url.startsWith('/cart')) this.activeTab.set('cart');
        else if (url.startsWith('/checkout')) this.activeTab.set('checkout');
        else this.activeTab.set('');
    }

    private refreshCartCount() {
        this.totalCarts.set(this.cartService.cartCount());
    }

    openSearch() {
        this.searchOverlay?.open();
    }

    openCartDrawer() {
        this.cartDrawer.open();
    }
}
