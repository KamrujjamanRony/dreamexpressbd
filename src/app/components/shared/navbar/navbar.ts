import { ChangeDetectorRef, Component, HostListener, inject, OnDestroy, Renderer2, signal, ViewChild } from '@angular/core';
import { SCart } from '../../../services/s-cart';
import { SWishlist } from '../../../services/s-wishlist';
import { Router, RouterLink } from '@angular/router';
import { SCategory } from '../../../services/s-category';
import { SProduct } from '../../../services/s-product';
import { debounceTime, distinctUntilChanged, of, Subject, Subscription, switchMap } from 'rxjs';
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
})
export class Navbar implements OnDestroy {
  cartService = inject(SCart);
  authService = inject(SAuthUser);
  authCookie = inject(SAuthCookie);
  wishListService = inject(SWishlist);
  private cdr = inject(ChangeDetectorRef);
  private renderer = inject(Renderer2);
  private CategoryService = inject(SCategory);
  private productService = inject(SProduct);
  private router = inject(Router);
  private cartDrawer = inject(CartDrawerService);

  categories: any[] = [];
  imageBaseUrl = environment.ImageApi;
  productList = signal<any[]>([]);
  searchValue = signal('');
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;
  searchResults = signal<any[]>([]);
  showSearchResults = signal(false);

  totalCarts = signal<number>(0);
  totalWishlists = signal<number>(0);
  user: any;

  // UI state signals
  isScrolled = signal(false);
  isMobileMenuOpen = signal(false);
  showCategoryDropdown = signal(false);
  showMobileCategories = signal(false);
  searchLoading = signal(false);

  @ViewChild('searchOverlay') searchOverlay!: SearchOverlay;

  openSearch() {
    this.searchOverlay?.open();
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.isScrolled.set(window.scrollY > 20);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.openSearch();
    }
  }

  ngOnInit() {
    this.user = this.authCookie.getUserData();
    this.refreshCartCount();
    this.refreshWishlistCount();

    this.authCookie.userChanged$.subscribe(userData => {
      this.user = userData;
      this.refreshCartCount();
      this.refreshWishlistCount();
      this.cdr.detectChanges();
    });

    this.cartService.cartUpdated$.subscribe(() => {
      this.refreshCartCount();
    });

    this.wishListService.wishlistUpdated$.subscribe(() => {
      this.refreshWishlistCount();
    });

    this.CategoryService.search().subscribe(data => {
      this.categories = data;
    });

    this.productService.search(0, 0, '', 1).subscribe(data => {
      this.productList.set(data);
      this.cdr.detectChanges();
    });

    this.setupSearch();
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
  setupSearch() {
    this.searchSubscription = this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(term => {
          if (!term || term.length < 2) {
            this.showSearchResults.set(false);
            this.searchLoading.set(false);
            return of([]);
          }
          this.searchLoading.set(true);
          return this.productService.search(0, 0, term, null);
        })
      )
      .subscribe(results => {
        this.searchResults.set(results);
        this.showSearchResults.set(results.length > 0 || this.searchValue().length >= 2);
        this.searchLoading.set(false);
      });
  }

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchValue.set(value);
    this.searchSubject.next(value);
  }

  onSearchFocus() {
    if (this.searchValue() && this.searchValue().length >= 2) {
      this.showSearchResults.set(true);
    }
  }

  onSearchBlur() {
    setTimeout(() => {
      this.showSearchResults.set(false);
    }, 200);
  }

  navigateToProduct(productId: number) {
    this.router.navigate(['/view', productId]);
    this.searchValue.set('');
    this.showSearchResults.set(false);
  }

  performSearch() {
    const term = this.searchValue();
    if (term && term.length >= 2) {
      this.router.navigate(['/shop'], { queryParams: { search: term } });
      this.searchValue.set('');
      this.showSearchResults.set(false);
    }
  }

  refreshCartCount() {
    this.user = this.authCookie.getUserData();
    this.cartService.refreshCartCount();
    this.totalCarts = this.cartService.cartCount;
    this.cdr.detectChanges();
  }

  openCartDrawer() {
    this.cartDrawer.open();
  }

  refreshWishlistCount() {
    this.wishListService.refreshWishlistCount();
    this.totalWishlists = this.wishListService.wishlistCount;
    this.cdr.detectChanges();
  }

  logout() {
    this.authService.logout();
    this.user = null;
    this.refreshCartCount();
    this.refreshWishlistCount();
  }

  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
    this.renderer.removeClass(document.body, 'overflow-hidden');
  }
}
