import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { BdtPipe } from '../../../pipes/bdt.pipe';
import { SWishlist } from '../../../services/s-wishlist';
import { SCart } from '../../../services/s-cart';
import { SAuthCookie } from '../../../services/s-auth-cookie';
import { NgOptimizedImage } from '@angular/common';
import { CartM, CartProductM } from '../../../models/Cart';
import { WishlistM } from '../../../models/Wishlist';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-wishlist-card',
  imports: [BdtPipe, NgOptimizedImage],
  templateUrl: './wishlist-card.html',
  styleUrl: './wishlist-card.css',
})
export class WishlistCard {
  @Input() product: any;
  @Input() userWishlist: any;
  @Output() wishlistUpdated = new EventEmitter<any>();

  wishListService = inject(SWishlist);
  cartService = inject(SCart);
  authCookieService = inject(SAuthCookie);

  user = this.authCookieService.getUserData();
  loading = false;

  async addToCartAndRemoveFromWishlist(product: any) {
    if (!this.user?.id) return;
    this.loading = true;

    try {
      await this.addToCart(product);
      await this.removeFromWishlist(product);
      this.wishlistUpdated.emit();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      this.loading = false;
    }
  }

  private async addToCart(product: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const cartItem: CartProductM = {
        productId: product.productId,
        quantity: 1,
        selectSize: '',
        selectColor: '',
        price: product.price || 0,
        totalPrice: product.price || 0,
      };

      this.cartService.search(this.user.id).subscribe({
        next: (cartData) => {
          if (cartData.length > 0) {
            const cart: CartM = cartData[0];
            const existingItem = cart.products.find((p: CartProductM) => p.productId === product.productId);
            if (existingItem) {
              existingItem.quantity += 1;
            } else {
              cart.products.push(cartItem);
            }
            this.cartService.update(cart.id!, cart).subscribe({
              next: () => resolve(),
              error: (e: any) => reject(e),
            });
          } else {
            const newCart: CartM = {
              companyID: environment.companyCode,
              userId: this.user.id,
              products: [cartItem],
              subtotal: 0,
              discountToken: '',
              discountType: '',
              discountAmount: 0,
              discountValue: 0,
              totalAmount: 0,
            };
            this.cartService.add(newCart).subscribe({
              next: () => resolve(),
              error: (e: any) => reject(e),
            });
          }
        },
        error: (e: any) => reject(e),
      });
    });
  }

  private async removeFromWishlist(product: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.userWishlist) {
        reject('No wishlist found');
        return;
      }

      const updatedProducts = this.userWishlist.products.filter(
        (p: any) => p.productId !== product.productId
      );

      const updatedWishlist: WishlistM = {
        ...this.userWishlist,
        products: updatedProducts,
      };

      this.wishListService.update(this.userWishlist.id, updatedWishlist).subscribe({
        next: () => resolve(),
        error: (e: any) => reject(e),
      });
    });
  }

  async deleteFromWishlist(product: any) {
    if (!this.user?.id) return;
    this.loading = true;

    try {
      await this.removeFromWishlist(product);
      this.wishlistUpdated.emit();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      this.loading = false;
    }
  }
}
