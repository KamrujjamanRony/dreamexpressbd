import { ChangeDetectorRef, Component, inject, OnDestroy, signal } from '@angular/core';
import { SCart } from '../../../services/s-cart';
import { SWishlist } from '../../../services/s-wishlist';
import { Router, RouterLink } from '@angular/router';
import { SCategory } from '../../../services/s-category';
import { SProduct } from '../../../services/s-product';
import { debounceTime, distinctUntilChanged, of, Subject, Subscription, switchMap } from 'rxjs';
import { SAuthUser } from '../../../services/s-auth-user';
import { SAuthCookie } from '../../../services/s-auth-cookie';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, NgOptimizedImage],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnDestroy {
  cartService = inject(SCart);
  authService = inject(SAuthUser);
  authCookie = inject(SAuthCookie);
  wishListService = inject(SWishlist);
  private cdr = inject(ChangeDetectorRef);
  private CategoryService = inject(SCategory);
  private productService = inject(SProduct);
  private router = inject(Router);

  categories: any[] = [];
  productList = signal<any[]>([]);
  searchValue = signal('');
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;
  searchResults = signal<any[]>([]);
  showSearchResults = signal(false);

  totalCarts = signal<number>(0);
  totalWishlists = signal<number>(0);
  user: any;
  category: string = 'all';

  ngOnInit() {
    this.user = this.authCookie.getUserData();
    this.refreshCartCount();

    // Listen for cart updates
    this.cartService.cartUpdated$.subscribe(() => {
      this.refreshCartCount();
    });

    // Listen for wishlist updates
    this.wishListService.wishlistUpdated$.subscribe(() => {
      this.fetchWishList();
    });

    // Fetch categories
    this.CategoryService.search().subscribe(data => {
      this.categories = data;
    });

    // Fetch product list
    this.productService.search().subscribe(data => {
      this.productList.set(data);
      this.cdr.detectChanges();
    });

    // Setup search functionality
    this.setupSearch();
  }
  ngAfterViewInit() {
    setTimeout(() => {
      const toggleOpen = document.getElementById('toggleOpen');
      const toggleClose = document.getElementById('toggleClose');
      const collapseMenu = document.getElementById('collapseMenu');

      if (toggleOpen && toggleClose && collapseMenu) {
        const handleClick = () => {
          if (collapseMenu.style.display === 'block') {
            collapseMenu.style.display = 'none';
          } else {
            collapseMenu.style.display = 'block';
          }
        };

        toggleOpen.addEventListener('click', handleClick);
        toggleClose.addEventListener('click', handleClick);
      }
    });
  }

  setupSearch() {
    this.searchSubscription = this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(term => {
          if (!term || term.length < 2) {
            this.showSearchResults.set(false);
            return of([]);
          }
          return of(this.filterProducts(term));
        })
      )
      .subscribe(results => {
        this.searchResults.set(results);
        this.showSearchResults.set(results.length > 0);
      });
  }

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchValue.set(value);
    this.searchSubject.next(value);
  }

  filterProducts(term: string): any[] {
    const lowerTerm = term.toLowerCase();
    return this.productList().filter(product =>
      product.name.toLowerCase().includes(lowerTerm) ||
      product.category.toLowerCase().includes(lowerTerm) ||
      product.brand.toLowerCase().includes(lowerTerm)
    );
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

  fetchWishList() {
    const customerId = this.authCookie.getUserData()?.id;
    if (!customerId) {
      this.totalWishlists.set(0);
      return;
    }
    this.wishListService.getWishlist(customerId).subscribe(data => {
      this.totalWishlists.set(data?.length > 0 ? data[0].products.length : 0);
      this.cdr.detectChanges();
    });
  }

  logout() {
    this.authService.logout();
    this.user = null;
    this.refreshCartCount();
  }

  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
  }

}
