// s-product.ts
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, tap, shareReplay, catchError, switchMap } from 'rxjs';
import { ProductColorM, ProductM } from '../models/Products';
import { SGallery } from './s-gallery';

@Injectable({
  providedIn: 'root',
})
export class SProduct {

  private http = inject(HttpClient);
  private galleryService = inject(SGallery);
  private apiUrl = `${environment.apiUrl}/Product`;

  // in-memory cache
  private searchCache = new Map<string, Observable<ProductM[]>>();

  // -------------------------
  // ADD PRODUCT
  // -------------------------
  add(model: any): Observable<ProductM> {
    return this.http.post<ProductM>(this.apiUrl, model).pipe(
      tap(() => this.clearCache()),
      catchError(this.handleError<ProductM>('add'))
    );
  }

  // -------------------------
  // SEARCH PRODUCTS (CACHED)
  // -------------------------
  search(
    categoryId: any = 0,
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
      ...(categoryId && categoryId > 0 ? { categoryId } : {}),
      ...(search ? { search: search.trim() } : {}),
      ...(title ? { title: title.trim() } : {}),
      ...(description ? { description: description.trim() } : {}),
      ...(brand ? { brand: brand.trim() } : {}),
      ...(model ? { model: model.trim() } : {}),
      ...(origin ? { origin: origin.trim() } : {}),
      ...(additionalInformation ? { additionalInformation: additionalInformation.trim() } : {}),
      ...(specialFeature ? { specialFeature: specialFeature.trim() } : {}),
      ...(catalogURL ? { catalogURL: catalogURL.trim() } : {}),
      ...(sl && sl > 0 ? { sl } : {})
    };

    const cacheKey = `${environment.companyCode}_${categoryId}_${search}_${title}_${description}_${brand}_${model}_${origin}_${additionalInformation}_${specialFeature}_${catalogURL}_${sl}`;

    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey)!;
    }

    const request$ = this.http
      .post<any>(`${this.apiUrl}/search`, reqBody)
      .pipe(
        map(res => Array.isArray(res) ? res : res?.data || res?.$values || []),
        switchMap((products: any[]) => {
          if (!products.length) return of(products as ProductM[]);
          return this.galleryService.search(undefined, 'Product').pipe(
            map(gallery => {
              const galleryMap = new Map<string, string>();
              gallery.forEach(g => {
                if (g.id && g.imageUrl) galleryMap.set(String(g.id), g.imageUrl);
              });
              return products.map(p => ({
                ...p,
                resolvedImageUrl: galleryMap.get(String(p.imageUrl)) || '',
                resolvedImages: (p.images || []).map((id: string) => galleryMap.get(String(id)) || ''),
                productColors: (p.productColors || []).map((c: any) => ({
                  ...c,
                  resolvedUrl: galleryMap.get(String(c.id)) || ''
                })) as ProductColorM[]
              })) as ProductM[];
            }),
            catchError(() => of(products as ProductM[]))
          );
        }),
        shareReplay(1),
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
  update(id: any, data: any): Observable<ProductM> {
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