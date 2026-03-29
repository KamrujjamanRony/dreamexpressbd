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
      next: () => {
        this.count = newQuantity;
        this.product.quantity = newQuantity;
        this.cartUpdated.emit(updatedCart.products);
      },
      error: (error: any) => {
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
    return id ? `/view/${id}` : '/shop';
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
        next: () => {
          this.cartUpdated.emit(updatedCart.products);
        },
        error: (error: any) => {
          console.error('Error deleting cart:', error);
        }
      });
    }
  }

  moveToWishlist(product: any) {
    if (!this.user?.id) return;
    this.loading = true;
    this.wishListService.toggleWishlist(product.productId?.toString(), '', '');
    this.deleteCart(product);
    this.loading = false;
  }
}
