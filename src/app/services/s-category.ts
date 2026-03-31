import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable, map, switchMap, of } from 'rxjs';
import { CategoryM } from '../models/Category';
import { SGallery } from './s-gallery';

@Injectable({
  providedIn: 'root',
})
export class SCategory {
  private readonly http = inject(HttpClient);
  private readonly galleryService = inject(SGallery);
  private apiUrl = `${environment.apiUrl}/Category`;

  add(model: any): Observable<CategoryM> {
    return this.http.post<CategoryM>(this.apiUrl, model);
  }

  search(): Observable<CategoryM[]> {
    const reqBody = { companyID: environment.companyCode };
    return this.http.post<any>(`${this.apiUrl}/Search`, reqBody).pipe(
      switchMap((res) => {
        const list = Array.isArray(res) ? res : res?.data || res?.$values || [];
        const categories: CategoryM[] = list.map(this.normalize);
        const hasGallery = categories.some(c => c.iGalleryId);
        if (!hasGallery) return of(categories);
        return this.galleryService.search(undefined, 'Category').pipe(
          map(gallery => {
            const urlMap = new Map(gallery.map(g => [g.id, g.imageUrl]));
            return categories.map(c => ({
              ...c,
              imageUrl: c.iGalleryId ? urlMap.get(c.iGalleryId) || '' : ''
            }));
          })
        );
      })
    );
  }

  update(id: any, model: any): Observable<CategoryM> {
    return this.http.put<CategoryM>(`${this.apiUrl}/${id}`, model);
  }

  delete(id: any): Observable<CategoryM> {
    return this.http.delete<CategoryM>(`${this.apiUrl}/${id}`);
  }

  private normalize(raw: any): CategoryM {
    const gallery = raw.iGallery ?? raw.IGallery ?? raw.igallery;
    return {
      id: raw.id ?? raw.Id,
      companyID: raw.companyID ?? raw.CompanyID ?? raw.companyId ?? raw.CompanyId,
      slCategory: raw.slCategory ?? raw.SLCategory ?? raw.SlCategory ?? null,
      categoryName: raw.categoryName ?? raw.CategoryName ?? '',
      iGalleryId: raw.iGalleryId ?? raw.IGalleryId ?? raw.igalleryId ?? '',
      imageUrl: raw.imageUrl ?? raw.ImageUrl ?? gallery?.imageUrl ?? gallery?.ImageUrl ?? '',
    };
  }

}
