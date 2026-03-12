import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { CartM } from '../models/Cart';

@Injectable({
  providedIn: 'root',
})
export class SCart {
  private cartUpdated = new BehaviorSubject<void>(undefined);
  cartUpdated$ = this.cartUpdated.asObservable();

  http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Cart`;

  add(model: CartM): Observable<CartM> {
    return this.http.post<CartM>(this.apiUrl, model).pipe(
      tap(() => this.cartUpdated.next()) // Notify subscribers of cart update
    );
  }

  search(userId: any): Observable<CartM[]> {
    const reqBody = { userId };
    return this.http.post<CartM[]>(`${this.apiUrl}/Search`, reqBody);
  }

  get(id: any): Observable<CartM> {
    return this.http.get<CartM>(`${this.apiUrl}/${id}`);
  }

  update(cartId: any, updateCartRequest: CartM | FormData): Observable<CartM> {
    return this.http.put<CartM>(`${this.apiUrl}/${cartId}`, updateCartRequest).pipe(
      tap(() => this.cartUpdated.next()) // Notify subscribers
    );
  }

  delete(id: any): Observable<CartM> {
    return this.http.delete<CartM>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.cartUpdated.next())
    );
  }

  // Add this method to your CartService
  clearCart(userId: any): void {
    this.search(userId).subscribe(cartItems => {
      if (cartItems && cartItems.length > 0) {
        cartItems.forEach(cartItem => {
          if (cartItem.id !== undefined && cartItem.id !== null) {
            this.delete(cartItem.id).subscribe(() => {
              this.cartUpdated.next(); // Notify subscribers that the cart has been cleared
            });
          }
        });
      }
    });
  }

}
