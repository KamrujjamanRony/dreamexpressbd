import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { BdtPipe } from '../../../pipes/bdt.pipe';
import { SWishlist } from '../../../services/s-wishlist';
import { SCart } from '../../../services/s-cart';
import { SAuthCookie } from '../../../services/s-auth-cookie';
import { NgOptimizedImage } from '@angular/common';

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
    if (!this.user?.uid) {
      // this.toastService.showMessage('warn', 'Warning', 'Please login first!');
      return;
    }

    this.loading = true;

    try {
      // 1. Add to cart
      await this.addToCart(product);

      // 2. Remove from wishlist
      await this.removeFromWishlist(product);

      // this.toastService.showMessage('success', 'Success', 'Product moved to cart!');
      this.wishlistUpdated.emit(); // Notify parent to refresh wishlist
    } catch (error) {
      // this.toastService.showMessage('error', 'Error', 'Failed to move product to cart');
      console.error('Error:', error);
    } finally {
      this.loading = false;
    }
  }

  private async addToCart(product: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const cartItem = {
        productId: product.productId,
        quantity: 1
      };

      this.cartService.getCart(this.user.uid).subscribe({
        next: (cartData) => {
          if (cartData.length > 0) {
            // Update existing cart
            const cart = cartData[0];
            const existingItem = cart.products.find((p: any) => p.productId === product.productId);

            if (existingItem) {
              existingItem.quantity += 1;
            } else {
              cart.products.push(cartItem);
            }

            this.cartService.updateCart(cart.id, cart).subscribe({
              next: () => resolve(),
              error: (err) => reject(err)
            });
          } else {
            // Create new cart
            const newCart = {
              userId: this.user.uid,
              products: [cartItem]
            };

            this.cartService.addCart(newCart).subscribe({
              next: () => resolve(),
              error: (err) => reject(err)
            });
          }
        },
        error: (err) => reject(err)
      });
    });
  }

  private async removeFromWishlist(product: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.userWishlist) {
        reject('No wishlist found');
        return;
      }

      const updatedProducts = this.userWishlist.products.filter(
        (p: any) => p.id !== product.id
      );

      const updatedWishlist = {
        ...this.userWishlist,
        products: updatedProducts
      };

      this.wishListService.updateWishlist(this.userWishlist.id, updatedWishlist).subscribe({
        next: () => resolve(),
        error: (err) => reject(err)
      });
    });
  }

  async deleteFromWishlist(product: any) {
    if (!this.user?.uid) {
      // this.toastService.showMessage('warn', 'Warning', 'Please login first!');
      return;
    }

    this.loading = true;

    try {
      await this.removeFromWishlist(product);
      // this.toastService.showMessage('success', 'Success', 'Product removed from wishlist');
      this.wishlistUpdated.emit();
    } catch (error) {
      // this.toastService.showMessage('error', 'Error', 'Failed to remove product');
      console.error('Error:', error);
    } finally {
      this.loading = false;
    }
  }

}
