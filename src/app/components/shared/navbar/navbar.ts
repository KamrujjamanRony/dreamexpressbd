import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { SCart } from '../../../services/s-cart';
import { SWishlist } from '../../../services/s-wishlist';
import { Router, RouterLink } from '@angular/router';
import { SCategory } from '../../../services/s-category';
import { SProduct } from '../../../services/s-product';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { SAuthUser } from '../../../services/s-auth-user';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  cartService = inject(SCart);
  authService = inject(SAuthUser);
  wishListService = inject(SWishlist);
  private cdr = inject(ChangeDetectorRef);
  private CategoryService = inject(SCategory);
  private productService = inject(SProduct);
  private router = inject(Router);

  categories: any[] = [];
  productList = signal<any[]>([]);
  searchControl = new FormControl();
  searchResults = signal<any[]>([]);
  showSearchResults = signal(false);

  totalCarts = signal<number>(0);
  totalWishlists = signal<number>(0);
  user: any;
  category: string = 'all';

  ngOnInit() {
    this.authService.get((user: any) => {
      this.user = user;
      if (this.user?.uid) {
        this.fetchUserCart();
        this.fetchWishList();
      }
    });

    // Listen for cart updates
    this.cartService.cartUpdated$.subscribe(() => {
      this.fetchUserCart();
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
    this.searchControl.valueChanges
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

  filterProducts(term: string): any[] {
    const lowerTerm = term.toLowerCase();
    return this.productList().filter(product =>
      product.name.toLowerCase().includes(lowerTerm) ||
      product.category.toLowerCase().includes(lowerTerm) ||
      product.brand.toLowerCase().includes(lowerTerm)
    );
  }

  onSearchFocus() {
    if (this.searchControl.value && this.searchControl.value.length >= 2) {
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
    this.searchControl.reset();
    this.showSearchResults.set(false);
  }

  performSearch() {
    const term = this.searchControl.value;
    if (term && term.length >= 2) {
      this.router.navigate(['/shop'], { queryParams: { search: term } });
      this.searchControl.reset();
      this.showSearchResults.set(false);
    }
  }

  fetchUserCart() {
    if (!this.user?.uid) {
      this.totalCarts.set(0);
      return;
    }
    this.cartService.search(this.user?.uid).subscribe(data => {
      this.totalCarts.set(data?.length > 0 ? data[0].products.reduce((sum: number, p: { quantity: any; }) => sum + p.quantity, 0) : 0);
      this.cdr.detectChanges();
    });
  }

  fetchWishList() {
    if (!this.user?.uid) {
      this.totalWishlists.set(0);
      return;
    }
    this.wishListService.getWishlist(this.user?.uid).subscribe(data => {
      this.totalWishlists.set(data?.length > 0 ? data[0].products.length : 0);
      this.cdr.detectChanges();
    });
  }

  logout() {
    this.authService.logout();
  }

}
