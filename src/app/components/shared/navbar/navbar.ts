import { ChangeDetectionStrategy, Component, HostListener, inject, Renderer2, signal, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SCategory } from '../../../services/s-category';
import { SCart } from '../../../services/s-cart';
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
export class Navbar {
  private renderer = inject(Renderer2);
  private CategoryService = inject(SCategory);
  private cartService = inject(SCart);
  private cartDrawer = inject(CartDrawerService);
  private router = inject(Router);

  categories = signal<any[]>([]);
  imageBaseUrl = environment.ImageApi;
  companyName = environment.companyName;
  totalCarts = signal<number>(0);

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

  ngOnInit() {
    this.refreshCartCount();
    this.cartService.cartUpdated$.subscribe(() => this.refreshCartCount());
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
    this.cartService.refreshCartCount();
    this.totalCarts = this.cartService.cartCount;
  }

  openCartDrawer() {
    this.cartDrawer.open();
  }
}
