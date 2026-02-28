import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SCart {
  private cartUpdated = new BehaviorSubject<void>(undefined);
  cartUpdated$ = this.cartUpdated.asObservable();

  http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Cart`;

  addCart(model: any | FormData): Observable<void> {
    return this.http.post<void>(this.apiUrl, model).pipe(
      tap(() => this.cartUpdated.next()) // Notify subscribers of cart update
    );
  }

  getCart(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  updateCart(cartId: string, updateCartRequest: any | FormData): Observable<string> {
    return this.http.put(`${this.apiUrl}/${cartId}`, updateCartRequest,
      { responseType: 'text' }).pipe(
        tap(() => this.cartUpdated.next()) // Notify subscribers
      );
  }

  deleteCart(id: string): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      responseType: 'text' as const  // Use 'as const' to properly type the response
    }).pipe(
      tap(() => this.cartUpdated.next())
    );
  }

  // Add this method to your CartService
  clearCart(userId: string): any {
    this.getCart(userId).subscribe(cart => {
      if (cart[0]) {
        this.deleteCart(cart[0].id).subscribe(data => {
          this.cartUpdated.next(); // Notify subscribers that the cart has been cleared
        });
      }
    });
  }
  
}
