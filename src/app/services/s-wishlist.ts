import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { WishlistM, WishlistProductM } from '../models/Wishlist';
import { SAuthCookie } from './s-auth-cookie';

@Injectable({
  providedIn: 'root',
})
export class SWishlist {
  private wishlistUpdated = new BehaviorSubject<void>(undefined);
  wishlistUpdated$ = this.wishlistUpdated.asObservable();

  private http = inject(HttpClient);
  private authCookie = inject(SAuthCookie);
  private apiUrl = `${environment.apiUrl}/Wishlist`;
  private readonly LOCAL_WISHLIST_KEY = 'guest_wishlist';

  /** Reactive wishlist item count */
  wishlistCount = signal<number>(0);

  /* ─────────── Customer check ─────────── */
  isCustomer(): boolean {
    return !!this.authCookie.getUserData();
  };

  getCustomerId(): string | null {
    return this.authCookie.getUserData()?.id?.toString() || null;
  };

  /* ─────────── API methods (Customer) ─────────── */
  add(model: WishlistM): Observable<WishlistM> {
    return this.http.post<WishlistM>(this.apiUrl, model).pipe(
      tap(() => this.wishlistUpdated.next())
    );
  };

  search(userId: string): Observable<WishlistM[]> {
    const reqBody = { 
      "companyID": environment.companyCode, userId };
    return this.http.post<WishlistM[]>(`${this.apiUrl}/Search`, reqBody);
  };

  update(id: any, updateRequest: WishlistM): Observable<WishlistM> {
    return this.http.put<WishlistM>(`${this.apiUrl}/${id}`, updateRequest).pipe(
      tap(() => this.wishlistUpdated.next())
    );
  };

  delete(id: any): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.wishlistUpdated.next())
    );
  };

  /* ─────────── Local wishlist (Guest) ─────────── */
  getLocalWishlist(): WishlistProductM[] {
    const data = localStorage.getItem(this.LOCAL_WISHLIST_KEY);
    return data ? JSON.parse(data) : [];
  };

  private saveLocalWishlist(products: WishlistProductM[]): void {
    localStorage.setItem(this.LOCAL_WISHLIST_KEY, JSON.stringify(products));
    this.wishlistUpdated.next();
  };

  addLocalProduct(product: WishlistProductM): void {
    const list = this.getLocalWishlist();
    const exists = list.some(
      p => p.productId === product.productId &&
        p.selectSize === product.selectSize &&
        p.selectColor === product.selectColor
    );
    if (!exists) {
      list.push(product);
      this.saveLocalWishlist(list);
    }
  };

  removeLocalProduct(productId: string, selectSize?: string, selectColor?: string): void {
    let list = this.getLocalWishlist();
    list = list.filter(
      p => !(
        p.productId === productId &&
        (!selectSize || p.selectSize === selectSize) &&
        (!selectColor || p.selectColor === selectColor)
      )
    );
    this.saveLocalWishlist(list);
  };

  isInLocalWishlist(productId: string): boolean {
    return this.getLocalWishlist().some(p => p.productId === productId);
  };

  clearLocalWishlist(): void {
    localStorage.removeItem(this.LOCAL_WISHLIST_KEY);
    this.wishlistUpdated.next();
  };

  /* ─────────── Unified helpers ─────────── */
  refreshWishlistCount(): void {
    if (this.isCustomer()) {
      const customerId = this.getCustomerId();
      if (customerId) {
        this.search(customerId).subscribe({
          next: (data) => {
            const count = data?.length > 0 ? data[0].products.length : 0;
            this.wishlistCount.set(count);
          },
          error: () => this.wishlistCount.set(0),
        });
      }
    } else {
      this.wishlistCount.set(this.getLocalWishlist().length);
    }
  };

  /** Toggle wishlist item: add if not exists, remove if exists */
  toggleWishlist(productId: string, selectSize = '', selectColor = ''): void {
    const product: WishlistProductM = { productId, selectSize, selectColor };

    if (this.isCustomer()) {
      const customerId = this.getCustomerId()!;
      this.search(customerId).subscribe({
        next: (wishlistData) => {
          if (wishlistData.length > 0) {
            const wishlist = wishlistData[0];
            const existIdx = wishlist.products.findIndex(
              p => p.productId === productId &&
                p.selectSize === selectSize &&
                p.selectColor === selectColor
            );

            if (existIdx !== -1) {
              // Remove
              wishlist.products.splice(existIdx, 1);
            } else {
              // Add
              wishlist.products.push(product);
            }

            this.update(wishlist.id!, wishlist).subscribe();
          } else {
            // Create new wishlist
            const newWishlist: WishlistM = {
              companyID: environment.companyCode,
              userId: customerId,
              products: [product],
            };
            this.add(newWishlist).subscribe();
          }
        },
      });
    } else {
      // Guest
      if (this.isInLocalWishlist(productId)) {
        this.removeLocalProduct(productId, selectSize, selectColor);
      } else {
        this.addLocalProduct(product);
      }
    }
  };

  /** Merge local guest wishlist into customer's API wishlist on login */
  mergeGuestWishlist(customerId: string): void {
    const localWishlist = this.getLocalWishlist();
    if (localWishlist.length === 0) return;

    this.search(customerId).subscribe({
      next: (apiWishlists) => {
        if (apiWishlists.length > 0) {
          const wishlist = apiWishlists[0];
          for (const localItem of localWishlist) {
            const exists = wishlist.products.some(
              p => p.productId === localItem.productId &&
                p.selectSize === localItem.selectSize &&
                p.selectColor === localItem.selectColor
            );
            if (!exists) {
              wishlist.products.push(localItem);
            }
          }
          this.update(wishlist.id!, wishlist).subscribe(() => {
            this.clearLocalWishlist();
            this.refreshWishlistCount();
          });
        } else {
          const newWishlist: WishlistM = {
            companyID: environment.companyCode,
            userId: customerId,
            products: localWishlist,
          };
          this.add(newWishlist).subscribe(() => {
            this.clearLocalWishlist();
            this.refreshWishlistCount();
          });
        }
      },
    });
  }
};
