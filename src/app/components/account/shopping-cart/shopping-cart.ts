import { Component, inject, signal } from '@angular/core';
import { BdtPipe } from '../../../pipes/bdt.pipe';
import { SCart } from '../../../services/s-cart';
import { SProduct } from '../../../services/s-product';
import { SAuthCookie } from '../../../services/s-auth-cookie';
import { Router, RouterLink } from '@angular/router';
import { CartM, CartProductM } from '../../../models/Cart';
import { SToast } from '../../../utils/toast/toast.service';
import { NgOptimizedImage } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faTrash,
  faMinus,
  faPlus,
  faShoppingBag,
  faArrowLeft,
  faCartShopping,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-shopping-cart',
  imports: [BdtPipe, NgOptimizedImage, FontAwesomeModule, RouterLink],
  templateUrl: './shopping-cart.html',
  styleUrl: './shopping-cart.css',
})
export class ShoppingCart {
  private cartService = inject(SCart);
  private productService = inject(SProduct);
  private authCookie = inject(SAuthCookie);
  private router = inject(Router);
  private toast = inject(SToast);

  faTrash = faTrash;
  faMinus = faMinus;
  faPlus = faPlus;
  faShoppingBag = faShoppingBag;
  faArrowLeft = faArrowLeft;
  faCartShopping = faCartShopping;

  imgBaseUrl = environment.ImageApi;

  carts = signal<any[]>([]);
  userCarts = signal<CartM | null>(null);
  products = signal<any[]>([]);
  loading = signal(true);
  totalPrice = signal(0);
  totalQuantity = signal(0);

  get isCustomer(): boolean {
    return this.cartService.isCustomer();
  }

  ngOnInit() {
    this.loadCart();
    this.cartService.cartUpdated$.subscribe(() => this.loadCart());
  }

  loadCart() {
    this.loading.set(true);
    this.productService.search().subscribe((productData) => {
      this.products.set(productData);

      if (this.isCustomer) {
        const customerId = this.cartService.getCustomerId();
        if (!customerId) { this.loading.set(false); return; }

        this.cartService.search(customerId).subscribe({
          next: (cartData: CartM[]) => {
            if (cartData?.length > 0) {
              this.userCarts.set(cartData[0]);
              this.carts.set(this.mergeCartAndProducts(cartData[0].products || []));
            } else {
              this.carts.set([]);
            }
            this.calculateTotals();
            this.loading.set(false);
          },
          error: () => {
            this.carts.set([]);
            this.loading.set(false);
          },
        });
      } else {
        // Guest: load from localStorage
        const localCart = this.cartService.getLocalCart();
        this.carts.set(this.mergeCartAndProducts(localCart));
        this.calculateTotals();
        this.loading.set(false);
      }
    });
  }

  mergeCartAndProducts(cartItems: CartProductM[]) {
    return cartItems.map((cartItem) => {
      const product = this.products().find((p) => p.id == cartItem.productId);
      const price = cartItem.price || product?.offerPrice || product?.regularPrice || 0;
      return {
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        selectColor: cartItem.selectColor,
        selectSize: cartItem.selectSize,
        productName: product?.title || product?.name || 'Unknown',
        price,
        image: product?.imageUrl ? this.imgBaseUrl + product.imageUrl : product?.image || '',
        category: product?.itemName || product?.category || '',
        brand: product?.brand || '',
      };
    });
  }

  calculateTotals() {
    const items = this.carts();
    this.totalPrice.set(
      Math.round(items.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100) / 100
    );
    this.totalQuantity.set(items.reduce((sum, i) => sum + i.quantity, 0));
  }

  increase(item: any) {
    this.updateQuantity(item, item.quantity + 1);
  }

  decrease(item: any) {
    if (item.quantity <= 1) return;
    this.updateQuantity(item, item.quantity - 1);
  }

  updateQuantity(item: any, newQty: number) {
    if (this.isCustomer) {
      const cart = this.userCarts();
      if (!cart) return;
      const updated: CartM = {
        ...cart,
        products: cart.products.map((p) =>
          p.productId === item.productId &&
            p.selectSize === item.selectSize &&
            p.selectColor === item.selectColor
            ? { ...p, quantity: newQty }
            : p
        ),
      };
      this.cartService.update(cart.id!, updated).subscribe({
        next: () => {
          this.userCarts.set(updated);
          this.carts.set(this.mergeCartAndProducts(updated.products));
          this.calculateTotals();
        },
      });
    } else {
      this.cartService.updateLocalQuantity(item.productId, newQty, item.selectSize, item.selectColor);
      const local = this.cartService.getLocalCart();
      this.carts.set(this.mergeCartAndProducts(local));
      this.calculateTotals();
    }
  }

  removeItem(item: any) {
    if (this.isCustomer) {
      const cart = this.userCarts();
      if (!cart) return;
      const updated: CartM = {
        ...cart,
        products: cart.products.filter(
          (p) =>
            !(
              p.productId === item.productId &&
              p.selectSize === item.selectSize &&
              p.selectColor === item.selectColor
            )
        ),
      };
      this.cartService.update(cart.id!, updated).subscribe({
        next: () => {
          this.userCarts.set(updated);
          this.carts.set(this.mergeCartAndProducts(updated.products));
          this.calculateTotals();
          this.toast.success('Item removed from cart', 'top-right', 2000);
        },
      });
    } else {
      this.cartService.removeLocalProduct(item.productId, item.selectSize, item.selectColor);
      const local = this.cartService.getLocalCart();
      this.carts.set(this.mergeCartAndProducts(local));
      this.calculateTotals();
      this.toast.success('Item removed from cart', 'top-right', 2000);
    }
  }

  proceedToCheckout() {
    if (this.carts().length === 0) {
      this.toast.warning('Your cart is empty', 'top-right', 3000);
      return;
    }

    const orderData = {
      products: this.carts(),
      subtotal: this.totalPrice(),
      quantity: this.totalQuantity(),
    };
    this.router.navigate(['/checkout'], { state: { orderData } });
  }

  getViewLink(productId: any) {
    return `/view/${productId}`;
  }
}
