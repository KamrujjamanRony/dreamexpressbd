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

  get(id: number): Observable<CartM> {
    return this.http.get<CartM>(`${this.apiUrl}/${id}`);
  }

  update(cartId: number, updateCartRequest: CartM | FormData): Observable<CartM> {
    return this.http.put<CartM>(`${this.apiUrl}/${cartId}`, updateCartRequest).pipe(
        tap(() => this.cartUpdated.next()) // Notify subscribers
      );
  }

  delete(id: number): Observable<CartM> {
    return this.http.delete<CartM>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.cartUpdated.next())
    );
  }

  // Add this method to your CartService
  clearCart(userId: number): void {
    this.get(userId).subscribe(cart => {
      if (cart) {
        this.delete(cart.id).subscribe(data => {
          this.cartUpdated.next(); // Notify subscribers that the cart has been cleared
        });
      }
    });
  }
  
}
