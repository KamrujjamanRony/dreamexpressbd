import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Product } from '../models/Products';

@Injectable({
  providedIn: 'root',
})
export class SProduct {
  http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Product`;

  add(model: any | FormData): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, model);
  }

  search(query: string = '', category: string = '', brand: string = ''): Observable<Product[]> {
    const queryParams = {
      search: query,
      category: category,
      brand: brand
    }
    return this.http.post<Product[]>(`${this.apiUrl}/search`, queryParams);
  }

  get(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  update(id: string, updateProductRequest: Product | FormData): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, updateProductRequest);
  }

  delete(id: string): Observable<Product> {
    return this.http.delete<Product>(`${this.apiUrl}/${id}`);
  }

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
  
}
