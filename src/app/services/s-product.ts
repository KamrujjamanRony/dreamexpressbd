import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, tap, shareReplay } from 'rxjs';
import { ProductColorsM, ProductM } from '../models/Products';

@Injectable({
  providedIn: 'root',
})
export class SProduct {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Product`;

  // in-memory cache
  private searchCache = new Map<string, Observable<ProductM[]>>();

  // -------------------------
  // ADD PRODUCT
  // -------------------------
  add(model: FormData): Observable<ProductM> {
    return this.http.post<ProductM>(this.apiUrl, model).pipe(
      tap(() => this.clearCache())
    );
  }

  // -------------------------
  // SEARCH PRODUCTS (CACHED)
  // -------------------------
  search(
    search: string = '',
    itemId: number = 0,
    title: string = '',
    description: string = '',
    brand: string = '',
    model: string = '',
    origin: string = '',
    additionalInformation: string = '',
    specialFeature: string = '',
    catalogURL: string = '',
    sl: number = 0,
  ): Observable<ProductM[]> {

    const reqBody = {
      search,
      companyID: environment.companyCode,
      title,
      description,
      itemId,
      brand,
      model,
      origin,
      additionalInformation,
      specialFeature,
      catalogURL,
      sl
    }

    const cacheKey = `${environment.companyCode}_${search}_${title}_${description}_${itemId}_${brand}_${model}_${origin}_${additionalInformation}_${specialFeature}_${catalogURL}_${sl}`;

    // return cached result if exists
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey)!;
    }

    const request$ = this.http
      .post<ProductM[]>(`${this.apiUrl}/search`,reqBody)
      .pipe(
        shareReplay(1) // prevent multiple API calls
      );

    this.searchCache.set(cacheKey, request$);

    return request$;
  }

  // -------------------------
  // GET SINGLE PRODUCT
  // -------------------------
  get(id: number): Observable<ProductM> {
    return this.http.get<ProductM>(`${this.apiUrl}/${id}`);
  }

  // -------------------------
  // UPDATE PRODUCT
  // -------------------------
  update(id: number, data: FormData): Observable<ProductM> {
    return this.http.put<ProductM>(`${this.apiUrl}/${id}`, data).pipe(
      tap(() => this.clearCache())
    );
  }

  // -------------------------
  // DELETE PRODUCT
  // -------------------------
  delete(id: number): Observable<ProductM> {
    return this.http.delete<ProductM>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.clearCache())
    );
  }

  // -------------------------
  // RELATED PRODUCTS
  // -------------------------
  getRelated(productId: number): Observable<ProductM[]> {
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
  // ADD PRODUCT COLORS
  // -------------------------
  addColor(id: number, model: ProductColorsM[]): Observable<ProductColorsM[]> {
    return this.http.post<ProductColorsM[]>(`${this.apiUrl}/${id}/colors`, model).pipe(
      tap(() => this.clearCache())
    );
  }

   // -------------------------
  // GET SINGLE PRODUCT COLORS
  // -------------------------
  getColor(id: number): Observable<ProductColorsM[]> {
    return this.http.get<ProductColorsM[]>(`${this.apiUrl}/${id}/colors`);
  }

   // -------------------------
  // UPDATE PRODUCT COLORS
  // -------------------------
  updateColor(id: number, data: ProductColorsM[]): Observable<ProductColorsM[]> {
    return this.http.put<ProductColorsM[]>(`${this.apiUrl}/${id}/colors`, data).pipe(
      tap(() => this.clearCache())
    );
  }

  // -------------------------
  // CLEAR CACHE
  // -------------------------
  private clearCache() {
    this.searchCache.clear();
  }

}