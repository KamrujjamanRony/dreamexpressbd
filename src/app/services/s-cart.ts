import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Subject, map, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { CartM, CartProductM } from '../models/Cart';
import { SAuthCookie } from './s-auth-cookie';
import { SGuest } from './s-guest';

@Injectable({
  providedIn: 'root',
})
export class SCart {
  private cartUpdated = new Subject<void>();
  cartUpdated$ = this.cartUpdated.asObservable();

  http = inject(HttpClient);
  private authCookie = inject(SAuthCookie);
  private guestService = inject(SGuest);
  private apiUrl = `${environment.apiUrl}/Cart`;
  private readonly LOCAL_CART_KEY = 'guest_cart';

  /** Reactive cart item count */
  cartCount = signal<number>(0);

  /* ─────────── Customer check ─────────── */
  isCustomer(): boolean {
    return !!this.authCookie.getUserData();
  }

  getCustomerId(): string | null {
    return this.authCookie.getUserData()?.id || null;
  }

  /* ─────────── API methods (unchanged) ─────────── */
  add(model: CartM): Observable<CartM> {
    return this.http.post<CartM>(this.apiUrl, model).pipe(
      tap(() => this.cartUpdated.next())
    );
  }

  search(userId: any): Observable<CartM[]> {
    const reqBody = {
      "companyID": environment.companyCode,
      "userId": userId
    };
    return this.http.post<any>(`${this.apiUrl}/Search`, reqBody).pipe(
      map(data => this.normalizeCartList(data))
    );
  }

  private normalizeCartList(data: any): CartM[] {
    const list = data?.$values || data || [];
    return Array.isArray(list) ? list.map((c: any) => this.normalizeCart(c)) : [];
  }

  private normalizeCart(c: any): CartM {
    const rawProducts = c.products ?? c.Products;
    const products = rawProducts?.$values || rawProducts || [];
    return {
      id: c.id ?? c.Id,
      companyID: c.companyID ?? c.CompanyID,
      userId: c.userId ?? c.UserId,
      subtotal: c.subtotal ?? c.Subtotal ?? 0,
      discountToken: c.discountToken ?? c.DiscountToken ?? '',
      discountType: c.discountType ?? c.DiscountType ?? '',
      discountValue: c.discountValue ?? c.DiscountValue ?? 0,
      discountAmount: c.discountAmount ?? c.DiscountAmount ?? 0,
      totalAmount: c.totalAmount ?? c.TotalAmount ?? 0,
      products: Array.isArray(products) ? products.map((p: any) => ({
        id: p.id ?? p.Id,
        productId: p.productId ?? p.ProductId,
        selectSize: p.selectSize ?? p.SelectSize ?? '',
        selectColor: p.selectColor ?? p.SelectColor ?? '',
        quantity: p.quantity ?? p.Quantity ?? 1,
        price: p.price ?? p.Price ?? 0,
        totalPrice: p.totalPrice ?? p.TotalPrice ?? 0,
      })) : [],
    };
  }

  get(id: any): Observable<CartM> {
    return this.http.get<CartM>(`${this.apiUrl}/${id}`);
  }

  update(cartId: any, updateCartRequest: CartM | FormData): Observable<CartM> {
    return this.http.put<CartM>(`${this.apiUrl}/${cartId}`, updateCartRequest).pipe(
      tap(() => this.cartUpdated.next())
    );
  }

  delete(id: any): Observable<CartM> {
    return this.http.delete<CartM>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.cartUpdated.next())
    );
  }

  clearCart(userId: any): void {
    this.search(userId).subscribe(cartItems => {
      if (cartItems && cartItems.length > 0) {
        cartItems.forEach(cartItem => {
          if (cartItem.id !== undefined && cartItem.id !== null) {
            this.delete(cartItem.id).subscribe(() => {
              this.cartUpdated.next();
            });
          }
        });
      }
    });
  }

  /* ─────────── Local cart (guest) ─────────── */
  getLocalCart(): CartProductM[] {
    const data = localStorage.getItem(this.LOCAL_CART_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveLocalCart(products: CartProductM[]): void {
    localStorage.setItem(this.LOCAL_CART_KEY, JSON.stringify(products));
    this.cartUpdated.next();
  }

  addLocalProduct(product: CartProductM): void {
    const cart = this.getLocalCart();
    const idx = cart.findIndex(
      (p) =>
        p.productId === product.productId &&
        p.selectSize === product.selectSize &&
        p.selectColor === product.selectColor
    );
    if (idx !== -1) {
      cart[idx].quantity += product.quantity;
    } else {
      cart.push(product);
    }
    this.saveLocalCart(cart);
  }

  updateLocalQuantity(productId: number, quantity: number, selectSize?: string, selectColor?: string): void {
    const cart = this.getLocalCart();
    const idx = cart.findIndex(
      (p) =>
        p.productId === productId &&
        (!selectSize || p.selectSize === selectSize) &&
        (!selectColor || p.selectColor === selectColor)
    );
    if (idx !== -1) {
      cart[idx].quantity = Math.max(1, quantity);
      this.saveLocalCart(cart);
    }
  }

  removeLocalProduct(productId: number, selectSize?: string, selectColor?: string): void {
    let cart = this.getLocalCart();
    cart = cart.filter(
      (p) =>
        !(
          p.productId === productId &&
          (!selectSize || p.selectSize === selectSize) &&
          (!selectColor || p.selectColor === selectColor)
        )
    );
    this.saveLocalCart(cart);
  }

  clearLocalCart(): void {
    localStorage.removeItem(this.LOCAL_CART_KEY);
    this.cartUpdated.next();
  }

  /* ─────────── Unified helpers ─────────── */
  refreshCartCount(): void {
    if (this.isCustomer()) {
      const customerId = this.getCustomerId();
      if (customerId) {
        this.search(customerId).subscribe({
          next: (data) => {
            const count =
              data?.length > 0
                ? data[0].products.reduce((sum, p) => sum + p.quantity, 0)
                : 0;
            this.cartCount.set(count);
          },
          error: () => this.cartCount.set(0),
        });
      }
    } else {
      const localCart = this.getLocalCart();
      const count = localCart.reduce((sum, p) => sum + p.quantity, 0);
      this.cartCount.set(count);
    }
  }

  /** Merge local guest cart into customer's API cart on login */
  mergeGuestCart(customerId: string): void {
    const localCart = this.getLocalCart();
    if (localCart.length === 0) return;

    this.search(customerId).subscribe({
      next: (apiCarts) => {
        if (apiCarts.length > 0) {
          // Customer has existing cart → merge products
          const userCart: CartM = { ...apiCarts[0] };
          for (const localItem of localCart) {
            const existIdx = userCart.products.findIndex(
              (p) =>
                p.productId === localItem.productId &&
                p.selectSize === localItem.selectSize &&
                p.selectColor === localItem.selectColor
            );
            if (existIdx !== -1) {
              userCart.products[existIdx].quantity += localItem.quantity;
            } else {
              userCart.products.push(localItem);
            }
          }
          this.update(userCart.id!, userCart).subscribe(() => {
            this.clearLocalCart();
            this.refreshCartCount();
          });
        } else {
          // No existing cart → create new
          const newCart: CartM = {
            userId: customerId,
            subtotal: 0,
            discountToken: '',
            discountType: '',
            discountValue: 0,
            discountAmount: 0,
            totalAmount: 0,
            products: localCart,
          };
          this.add(newCart).subscribe(() => {
            this.clearLocalCart();
            this.refreshCartCount();
          });
        }
      },
      error: () => {
        // Error searching → create new cart
        const newCart: CartM = {
          userId: customerId,
          subtotal: 0,
          discountToken: '',
          discountType: '',
          discountValue: 0,
          discountAmount: 0,
          totalAmount: 0,
          products: localCart,
        };
        this.add(newCart).subscribe(() => {
          this.clearLocalCart();
          this.refreshCartCount();
        });
      },
    });
  }
}
