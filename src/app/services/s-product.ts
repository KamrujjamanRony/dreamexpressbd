// s-product.ts
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, tap, shareReplay, catchError } from 'rxjs';
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
      tap(() => this.clearCache()),
      catchError(this.handleError<ProductM>('add'))
    );
  }

  // -------------------------
  // SEARCH PRODUCTS (CACHED)
  // -------------------------
  search(
    itemId: any = 0,
    search: string = '',
    title: string = '',
    description: string = '',
    brand: string = '',
    model: string = '',
    origin: string = '',
    additionalInformation: string = '',
    specialFeature: string = '',
    catalogURL: string = '',
    sl: any = 0,
  ): Observable<ProductM[]> {

    const reqBody = {
      companyID: environment.companyCode,
      ...(itemId && itemId > 0 ? { itemId: itemId } : {}),
      ...(search ? { search: search.trim() } : {}),
      ...(title ? { title: title.trim() } : {}),
      ...(description ? { description: description.trim() } : {}),
      ...(brand ? { brand: brand.trim() } : {}),
      ...(model ? { model: model.trim() } : {}),
      ...(origin ? { origin: origin.trim() } : {}),
      ...(additionalInformation ? { additionalInformation: additionalInformation.trim() } : {}),
      ...(specialFeature ? { specialFeature: specialFeature.trim() } : {}),
      ...(catalogURL ? { catalogURL: catalogURL.trim() } : {}),
      ...(sl && sl > 0 ? { sl: sl } : {})
    }

    const cacheKey = `${environment.companyCode}_${search}_${title}_${description}_${itemId}_${brand}_${model}_${origin}_${additionalInformation}_${specialFeature}_${catalogURL}_${sl}`;

    // return cached result if exists
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey)!;
    }

    const request$ = this.http
      .post<ProductM[]>(`${this.apiUrl}/search`, reqBody)
      .pipe(
        shareReplay(1), // prevent multiple API calls
        catchError(this.handleError<ProductM[]>('search', []))
      );

    this.searchCache.set(cacheKey, request$);

    return request$;
  }

  // -------------------------
  // GET SINGLE PRODUCT
  // -------------------------
  get(id: any): Observable<ProductM> {
    return this.http.get<ProductM>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError<ProductM>('get'))
    );
  }

  // -------------------------
  // UPDATE PRODUCT
  // -------------------------
  update(id: any, data: FormData): Observable<ProductM> {
    return this.http.put<ProductM>(`${this.apiUrl}/${id}`, data).pipe(
      tap(() => this.clearCache()),
      catchError(this.handleError<ProductM>('update'))
    );
  }

  // -------------------------
  // DELETE PRODUCT
  // -------------------------
  delete(id: any): Observable<ProductM> {
    return this.http.delete<ProductM>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.clearCache()),
      catchError(this.handleError<ProductM>('delete'))
    );
  }

  // -------------------------
  // RELATED PRODUCTS
  // -------------------------
  getRelated(productId: any): Observable<ProductM[]> {
    return this.search().pipe(
      map(products => {
        const mainProduct = products.find(p => p.id === productId);
        if (!mainProduct?.relatedProducts) return [];
        return products.filter(p =>
          mainProduct.relatedProducts.includes(p.id) &&
          p.id !== productId
        );
      }),
      catchError(this.handleError<ProductM[]>('getRelated', []))
    );
  }

  // -------------------------
  // ADD PRODUCT COLORS
  // -------------------------
  addColor(id: any, colors: ProductColorsM[]): Observable<ProductColorsM[]> {
    // Ensure colors are properly formatted
    const formattedColors = colors.map(color => ({
      colorName: color.colorName || '',
      image: color.image || ''
    }));

    return this.http.post<ProductColorsM[]>(
      `${this.apiUrl}/${id}/colors`, 
      formattedColors,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    ).pipe(
      tap(() => this.clearCache()),
      catchError(this.handleError<ProductColorsM[]>('addColor'))
    );
  }

  // -------------------------
  // GET PRODUCT COLORS
  // -------------------------
  getColor(id: any): Observable<ProductColorsM[]> {
    return this.http.get<ProductColorsM[]>(`${this.apiUrl}/${id}/colors`).pipe(
      catchError(this.handleError<ProductColorsM[]>('getColor', []))
    );
  }

  // -------------------------
  // UPDATE PRODUCT COLORS
  // -------------------------
  updateColor(id: any, colors: ProductColorsM[]): Observable<ProductColorsM[]> {
    // Ensure colors are properly formatted
    const formattedColors = colors.map(color => ({
      colorName: color.colorName || '',
      image: color.image || ''
    }));

    return this.http.put<ProductColorsM[]>(
      `${this.apiUrl}/${id}/colors`, 
      formattedColors,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    ).pipe(
      tap(() => this.clearCache()),
      catchError(this.handleError<ProductColorsM[]>('updateColor'))
    );
  }

  // -------------------------
  // DELETE PRODUCT COLOR (if needed)
  // -------------------------
  deleteColor(productId: any, colorIndex?: number): Observable<any> {
    // If your API supports deleting specific colors, implement here
    // This is a placeholder - adjust based on your API
    return this.http.delete(`${this.apiUrl}/${productId}/colors/${colorIndex || ''}`).pipe(
      tap(() => this.clearCache()),
      catchError(this.handleError('deleteColor'))
    );
  }

  // -------------------------
  // CLEAR CACHE
  // -------------------------
  private clearCache() {
    this.searchCache.clear();
  }

  // -------------------------
  // ERROR HANDLER
  // -------------------------
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      // You can add toast notification here if needed
      throw error;
    };
  }
}