import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { map, Observable, switchMap, of } from 'rxjs';
import { CarouselM } from '../models/Carousel';
import { SGallery } from './s-gallery';

@Injectable({
  providedIn: 'root',
})
export class SCarousel {
  private readonly http = inject(HttpClient);
  private readonly galleryService = inject(SGallery);
  private apiUrl = `${environment.apiUrl}/Carousel`;

  add(model: any): Observable<CarouselM> {
    return this.http.post<CarouselM>(this.apiUrl, model);
  }

  get(id: any): Observable<CarouselM> {
    return this.http.get<CarouselM>(`${this.apiUrl}/${id}`);
  }

  search(title?: string, description?: string): Observable<CarouselM[]> {
    const reqBody = {
      "companyID": environment.companyCode,
      ...(title && title.length > 0 ? { title: title.trim() } : {}),
      ...(description && description.length > 0 ? { description: description.trim() } : {})
    }
    return this.http.post<any>(`${this.apiUrl}/Search`, reqBody).pipe(
      switchMap((res) => {
        const list = Array.isArray(res) ? res : res?.data || res?.$values || [];
        const carousels: CarouselM[] = list.map(this.normalize);
        const hasGallery = carousels.some(c => c.galleryId);
        if (!hasGallery) return of(carousels);
        return this.galleryService.search(undefined, 'Carousel').pipe(
          map(gallery => {
            const urlMap = new Map(gallery.map(g => [g.id, g.imageUrl]));
            return carousels.map(c => ({
              ...c,
              imageUrl: c.galleryId ? urlMap.get(c.galleryId) || '' : ''
            }));
          })
        );
      })
    );
  }

  update(id: any, model: any): Observable<CarouselM> {
    return this.http.put<CarouselM>(`${this.apiUrl}/${id}`, model);
  }

  delete(id: any): Observable<CarouselM> {
    return this.http.delete<CarouselM>(`${this.apiUrl}/${id}`);
  }

  private normalize(raw: any): CarouselM {
    return {
      id: raw.id ?? raw.Id,
      companyID: raw.companyID ?? raw.CompanyID ?? raw.companyId ?? raw.CompanyId,
      title: raw.title ?? raw.Title ?? '',
      description: raw.description ?? raw.Description ?? '',
      bLink: raw.bLink ?? raw.BLink ?? '',
      galleryId: raw.galleryId ?? raw.GalleryId ?? raw.galleryID ?? '',
      imageUrl: raw.imageUrl ?? raw.ImageUrl ?? '',
    };
  }

}
