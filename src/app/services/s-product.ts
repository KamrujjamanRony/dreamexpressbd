import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, tap, shareReplay } from 'rxjs';
import { Product } from '../models/Products';

@Injectable({
  providedIn: 'root',
})
export class SProduct {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Product`;

  // in-memory cache
  private searchCache = new Map<string, Observable<Product[]>>();

  // -------------------------
  // ADD PRODUCT
  // -------------------------
  add(model: Product | FormData): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, model).pipe(
      tap(() => this.clearCache())
    );
  }

  // -------------------------
  // SEARCH PRODUCTS (CACHED)
  // -------------------------
  search(
    query: string = '',
    category: string = '',
    brand: string = ''
  ): Observable<Product[]> {

    const cacheKey = `${query}_${category}_${brand}`;

    // return cached result if exists
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey)!;
    }

    const request$ = this.http
      .post<Product[]>(`${this.apiUrl}/search`, {
        search: query,
        category,
        brand,
      })
      .pipe(
        shareReplay(1) // prevent multiple API calls
      );

    this.searchCache.set(cacheKey, request$);

    return request$;
  }

  // -------------------------
  // GET SINGLE PRODUCT
  // -------------------------
  get(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  // -------------------------
  // UPDATE PRODUCT
  // -------------------------
  update(id: string, data: Product | FormData): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, data).pipe(
      tap(() => this.clearCache())
    );
  }

  // -------------------------
  // DELETE PRODUCT
  // -------------------------
  delete(id: string): Observable<Product> {
    return this.http.delete<Product>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.clearCache())
    );
  }

  // -------------------------
  // RELATED PRODUCTS
  // -------------------------
  getRelated(productId: number): Observable<Product[]> {
    return this.search().pipe(
      map(products => {

        const mainProduct = products.find(p => p.id === productId);
        if (!mainProduct?.relatedProducts) return [];

        return products.filter(p =>
          mainProduct.relatedProducts.includes(p.id) &&
          p.id !== productId
        );

      })
    );
  }

  // -------------------------
  // CLEAR CACHE
  // -------------------------
  private clearCache() {
    this.searchCache.clear();
  }

}