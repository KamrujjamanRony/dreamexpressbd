import { ChangeDetectionStrategy, Component, HostListener, inject, OnDestroy, Renderer2, signal, ViewChild } from '@angular/core';
import { SCart } from '../../../services/s-cart';
import { SWishlist } from '../../../services/s-wishlist';
import { Router, RouterLink } from '@angular/router';
import { SCategory } from '../../../services/s-category';
import { Subscription } from 'rxjs';
import { SAuthUser } from '../../../services/s-auth-user';
import { SAuthCookie } from '../../../services/s-auth-cookie';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { SearchOverlay } from '../search-overlay/search-overlay';
import { CartDrawerService } from '../../../utils/cart-drawer/cart-drawer.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, NgOptimizedImage, NgClass, SearchOverlay],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar implements OnDestroy {
  cartService = inject(SCart);
  authService = inject(SAuthUser);
  authCookie = inject(SAuthCookie);
  wishListService = inject(SWishlist);
  private renderer = inject(Renderer2);
  private CategoryService = inject(SCategory);
  private router = inject(Router);
  private cartDrawer = inject(CartDrawerService);

  categories = signal<any[]>([]);
  imageBaseUrl = environment.ImageApi;
  companyName = environment.companyName;

  totalCarts = signal<number>(0);
  totalWishlists = signal<number>(0);
  user: any;

  // UI state signals
  isScrolled = signal(false);
  isMobileMenuOpen = signal(false);
  showCategoryDropdown = signal(false);
  showMobileCategories = signal(false);

  @ViewChild('searchOverlay') searchOverlay!: SearchOverlay;

  openSearch() {
    this.searchOverlay?.open();
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    const scrolled = window.scrollY > 20;
    if (this.isScrolled() !== scrolled) {
      this.isScrolled.set(scrolled);
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.openSearch();
    }
  }

  private subs: Subscription[] = [];

  ngOnInit() {
    this.user = this.authCookie.getUserData();
    this.refreshCartCount();
    this.refreshWishlistCount();

    this.subs.push(
      this.authCookie.userChanged$.subscribe(userData => {
        this.user = userData;
        this.refreshCartCount();
        this.refreshWishlistCount();
      }),
      this.cartService.cartUpdated$.subscribe(() => {
        this.refreshCartCount();
      }),
      this.wishListService.wishlistUpdated$.subscribe(() => {
        this.refreshWishlistCount();
      })
    );

    this.CategoryService.search().subscribe(data => {
      this.categories.set(data);
    });
  }

  // Mobile menu
  toggleMobileMenu() {
    const open = !this.isMobileMenuOpen();
    this.isMobileMenuOpen.set(open);
    if (open) {
      this.renderer.addClass(document.body, 'overflow-hidden');
    } else {
      this.renderer.removeClass(document.body, 'overflow-hidden');
    }
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
    this.renderer.removeClass(document.body, 'overflow-hidden');
  }

  // Category dropdown
  toggleCategoryDropdown() {
    this.showCategoryDropdown.set(!this.showCategoryDropdown());
  }

  toggleMobileCategories() {
    this.showMobileCategories.set(!this.showMobileCategories());
  }

  // Search
  navigateToProduct(productId: number) {
    this.router.navigate(['/view', productId]);
  }

  performSearch() {
  }

  refreshCartCount() {
    this.user = this.authCookie.getUserData();
    this.cartService.refreshCartCount();
    this.totalCarts = this.cartService.cartCount;
  }

  openCartDrawer() {
    this.cartDrawer.open();
  }

  refreshWishlistCount() {
    this.wishListService.refreshWishlistCount();
    this.totalWishlists = this.wishListService.wishlistCount;
  }

  logout() {
    this.authService.logout();
    this.user = null;
    this.refreshCartCount();
    this.refreshWishlistCount();
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
    this.renderer.removeClass(document.body, 'overflow-hidden');
  }
}
