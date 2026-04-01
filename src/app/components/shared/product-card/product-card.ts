import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SAuthCookie } from '../../../services/s-auth-cookie';
import { SWishlist } from '../../../services/s-wishlist';
import { SCart } from '../../../services/s-cart';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHeart } from '@fortawesome/free-regular-svg-icons';
import { faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons';
import { BdtPipe } from "../../../pipes/bdt.pipe";
import { CartM, CartProductM } from '../../../models/Cart';
import { environment } from '../../../../environments/environment';
import { SToast } from '../../../utils/toast/toast.service';
import { CartDrawerService } from '../../../utils/cart-drawer/cart-drawer.service';

@Component({
  selector: 'app-product-card',
  imports: [CommonModule, RouterLink, FontAwesomeModule, BdtPipe, NgOptimizedImage],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class ProductCard {
  product = input<any>(null);
  isPriority = input(false);
  faHeart = faHeart;
  faHeartSolid = faHeartSolid;
  imageBaseUrl = environment.ImageApi;
  private authCookieService = inject(SAuthCookie);
  private wishListService = inject(SWishlist);
  private cartService = inject(SCart);
  private router = inject(Router);
  private toast = inject(SToast);
  private cartDrawer = inject(CartDrawerService);

  get isCustomer(): boolean {
    return this.cartService.isCustomer();
  }

  get isInWishlist(): boolean {
    const p = this.product();
    if (!p) return false;
    if (this.isCustomer) return false; // For customers, we'd need async check — skip icon toggle
    return this.wishListService.isInLocalWishlist(p.id?.toString());
  }

  getStarsArray(averageRating: number): boolean[] {
    const roundedRating = Math.round(averageRating * 2) / 2;
    return Array.from({ length: 5 }, (_, index) => index < roundedRating);
  }

  getViewLink(id: any) {
    return `/view/${id}`;
  }

  addToWishlist(product: any) {
    const p = product();
    if (!p) return;
    this.wishListService.toggleWishlist(p.id?.toString(), '', '');
    this.toast.success('Wishlist updated!', 'bottom-left', 2000);
  }

  addToCart(product: any) {
    const p = product();
    if (!p) return;
    const price = p.offerPrice || p.regularPrice || 0;
    const cartProduct: CartProductM = {
      productId: p.id,
      quantity: 1,
      selectSize: '',
      selectColor: '',
      price: price,
      totalPrice: price,
    };

    const customerId = this.cartService.getCustomerId();

    if (customerId) {
      this.cartService.search(customerId).subscribe({
        next: (cart) => {
          if (cart.length > 0) {
            const userCart: CartM = { ...cart[0] };
            const existIdx = userCart.products.findIndex(
              (cp: CartProductM) => cp.productId === cartProduct.productId
            );
            if (existIdx !== -1) {
              userCart.products[existIdx].quantity += 1;
            } else {
              userCart.products.push(cartProduct);
            }
            this.cartService.update(userCart.id!, userCart).subscribe({
              next: () => { this.toast.success('Added to cart!', 'bottom-left', 2000); this.cartDrawer.open(); },
              error: (e) => this.toast.danger(e?.error || 'Failed to add to cart', 'bottom-left', 3000),
            });
          } else {
            const newCart: CartM = {
              companyID: environment.companyCode,
              userId: customerId,
              products: [cartProduct],
              subtotal: 0,
              discountToken: '',
              discountType: '',
              discountAmount: 0,
              discountValue: 0,
              totalAmount: 0,
            };
            this.cartService.add(newCart).subscribe({
              next: () => { this.toast.success('Added to cart!', 'bottom-left', 2000); this.cartDrawer.open(); },
              error: (e) => this.toast.danger(e?.error || 'Failed to add to cart', 'bottom-left', 3000),
            });
          }
        },
        error: (e) => this.toast.danger(e?.error || 'Failed to add to cart', 'bottom-left', 3000),
      });
    } else {
      // Guest → store locally
      this.cartService.addLocalProduct(cartProduct);
      this.toast.success('Added to cart!', 'bottom-left', 2000);
      this.cartDrawer.open();
    }
  }
}
