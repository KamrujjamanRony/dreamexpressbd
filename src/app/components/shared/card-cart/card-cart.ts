import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BdtPipe } from '../../../pipes/bdt.pipe';
import { SCart } from '../../../services/s-cart';
import { SWishlist } from '../../../services/s-wishlist';
import { SAuthCookie } from '../../../services/s-auth-cookie';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-card-cart',
  imports: [RouterLink, BdtPipe, NgOptimizedImage],
  templateUrl: './card-cart.html',
  styleUrl: './card-cart.css',
})
export class CardCart {
  cartService = inject(SCart);
  wishListService = inject(SWishlist);
  authCookieService = inject(SAuthCookie);

  @Input() product: any;
  @Input() userCarts: any;
  @Output() cartUpdated = new EventEmitter<any>();

  count: number = 1;
  loading = false;
  user = this.authCookieService.getUserData();

  ngOnInit() {
    this.count = this.product.quantity;
  }

  private updateQuantity(newQuantity: number) {
    newQuantity = Math.max(1, newQuantity);

    const updatedCart = {
      ...this.userCarts,
      products: this.userCarts.products.map((p: any) =>
        p.productId === this.product.productId ? { ...p, quantity: newQuantity } : p
      ),
    };

    this.cartService.update(this.userCarts.id, updatedCart).subscribe({
      next: (response) => {
        this.count = newQuantity;
        this.product.quantity = newQuantity;
        this.cartUpdated.emit(updatedCart.products);
      },
      error: (error) => {
        console.error('Error updating cart quantity:', error);
        this.count = this.product.quantity;
      }
    });
  }

  increase() {
    this.updateQuantity(this.count + 1);
  }

  decrease() {
    this.updateQuantity(this.count - 1);
  }

  getViewLink(id: any) {
    return `/view/${id}`;
  }

  deleteCart(selected: any) {
    if (this.userCarts) {
      const updatedCart = {
        ...this.userCarts,
        products: this.userCarts.products.filter((p: any) =>
          p.productId !== selected.productId
        ),
      };

      this.cartService.update(this.userCarts.id, updatedCart).subscribe({
        next: (response) => {
          this.cartUpdated.emit(updatedCart.products);
          // this.toastService.showMessage('success', 'Success', 'Product removed from cart');
        },
        error: (error) => {
          // this.toastService.showMessage('error', 'Error', 'Failed to remove product');
          console.error('Error deleting cart:', error);
        }
      });
    }
  }

  async moveToWishlist(product: any) {
    if (!this.user?.uid) {
      // this.toastService.showMessage('warn', 'Warning', 'Please login first!');
      return;
    }

    this.loading = true;

    try {
      // 1. Add to wishlist
      await this.addToWishlist(product);

      // 2. Remove from cart
      this.deleteCart(product);

      // this.toastService.showMessage('success', 'Success', 'Product moved to wishlist');
    } catch (error) {
      // this.toastService.showMessage('error', 'Error', 'Failed to move product to wishlist');
      console.error('Error:', error);
    } finally {
      this.loading = false;
    }
  }

  private async addToWishlist(product: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.wishListService.getWishlist(this.user.uid).subscribe({
        next: (wishlist) => {
          const favoriteProduct = {
            id: crypto.randomUUID(),
            productId: product.productId
          };

          if (wishlist.length > 0) {
            // Update existing wishlist
            const existingWishlist = wishlist[0];
            const existingProduct = existingWishlist.products.find((p: any) => p.productId === product.productId);

            if (!existingProduct) {
              existingWishlist.products.push(favoriteProduct);
              this.wishListService.updateWishlist(existingWishlist.id, existingWishlist).subscribe({
                next: () => resolve(),
                error: (err) => reject(err)
              });
            } else {
              resolve(); // Already in wishlist
            }
          } else {
            // Create new wishlist
            const newWishlist = {
              userId: this.user.uid,
              products: [favoriteProduct]
            };
            this.wishListService.addWishlist(newWishlist).subscribe({
              next: () => resolve(),
              error: (err) => reject(err)
            });
          }
        },
        error: (err) => reject(err)
      });
    });
  }

}
