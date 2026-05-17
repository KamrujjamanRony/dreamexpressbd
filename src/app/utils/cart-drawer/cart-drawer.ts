import { Component, inject, signal, OnInit, OnDestroy, Renderer2, effect } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { Subscription } from 'rxjs';
import { CartDrawerService } from './cart-drawer.service';
import { SCart } from '../../services/s-cart';
import { SProduct } from '../../services/s-product';
import { CartM, CartProductM } from '../../models/Cart';
import { BdtPipe } from '../../pipes/bdt.pipe';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-cart-drawer',
  imports: [RouterLink, NgOptimizedImage, BdtPipe],
  templateUrl: './cart-drawer.html',
  styleUrl: './cart-drawer.css',
})
export class CartDrawer implements OnInit, OnDestroy {
  drawerService = inject(CartDrawerService);
  private cartService = inject(SCart);
  private productService = inject(SProduct);
  private renderer = inject(Renderer2);
  private router = inject(Router);

  imgBaseUrl = environment.ImageApi;
  items = signal<any[]>([]);
  loading = signal(false);
  subtotal = signal(0);
  private cartSub?: Subscription;

  get isCustomer(): boolean {
    return this.cartService.isCustomer();
  }

  constructor() {
    effect(() => {
      if (this.drawerService.isOpen()) {
        this.onOpen();
      } else {
        this.renderer.removeClass(document.body, 'overflow-hidden');
      }
    });
  }

  ngOnInit() {
    this.cartSub = this.cartService.cartUpdated$.subscribe(() => {
      if (this.drawerService.isOpen()) {
        this.loadCart();
      }
    });
  }

  ngOnDestroy() {
    this.cartSub?.unsubscribe();
  }

  onOpen() {
    this.loadCart();
    this.renderer.addClass(document.body, 'overflow-hidden');
  }

  onClose() {
    this.drawerService.close();
    this.renderer.removeClass(document.body, 'overflow-hidden');
  }

  loadCart() {
    this.loading.set(true);
    this.productService.search(0, 0, '', 1).subscribe(products => {
      if (this.isCustomer) {
        const customerId = this.cartService.getCustomerId();
        if (!customerId) { this.loading.set(false); return; }
        this.cartService.search(customerId).subscribe({
          next: (cartData: CartM[]) => {
            if (cartData?.length > 0) {
              this.items.set(this.mergeCartAndProducts(cartData[0].products || [], products));
            } else {
              this.items.set([]);
            }
            this.calcSubtotal();
            this.loading.set(false);
          },
          error: () => { this.items.set([]); this.loading.set(false); },
        });
      } else {
        const localCart = this.cartService.getLocalCart();
        this.items.set(this.mergeCartAndProducts(localCart, products));
        this.calcSubtotal();
        this.loading.set(false);
      }
    });
  }

  private mergeCartAndProducts(cartItems: CartProductM[], products: any[]) {
    return cartItems.map(ci => {
      const p = products.find((pr: any) => pr.id == ci.productId);
      const price = ci.price > 0 ? ci.price : (p?.offerPrice || p?.regularPrice || 0);
      return {
        productId: ci.productId,
        quantity: ci.quantity,
        selectSize: ci.selectSize,
        selectColor: ci.selectColor,
        productName: p?.title || 'Product',
        price,
        image: this.resolveProductImage(p),
      };
    });
  }

  private resolveProductImage(product: any): string {
    const value = product?.resolvedImageUrl || product?.imageUrl || '';
    if (!value) return '';
    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
      return value;
    }
    return `${this.imgBaseUrl}${value}`;
  }

  private calcSubtotal() {
    this.subtotal.set(
      Math.round(this.items().reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100
    );
  }

  removeItem(item: any) {
    if (this.isCustomer) {
      const customerId = this.cartService.getCustomerId();
      if (!customerId) return;
      this.cartService.search(customerId).subscribe(cartData => {
        if (cartData?.length > 0) {
          const cart = cartData[0];
          const updated: CartM = {
            ...cart,
            products: cart.products.filter(
              p => !(p.productId === item.productId && p.selectSize === item.selectSize && p.selectColor === item.selectColor)
            ),
          };
          this.cartService.update(cart.id!, updated).subscribe();
        }
      });
    } else {
      this.cartService.removeLocalProduct(item.productId, item.selectSize, item.selectColor);
      const local = this.cartService.getLocalCart();
      this.productService.search(0, 0, '', 1).subscribe(products => {
        this.items.set(this.mergeCartAndProducts(local, products));
        this.calcSubtotal();
      });
    }
  }

  proceedToCheckout() {
    if (this.items().length === 0) return;
    const orderData = {
      products: this.items(),
      subtotal: this.subtotal(),
      quantity: this.items().reduce((sum, i) => sum + i.quantity, 0),
    };
    this.onClose();
    this.router.navigate(['/checkout'], { state: { orderData } });
  }
}
