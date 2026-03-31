import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { map, Observable } from 'rxjs';
import { CarouselM } from '../models/Carousel';

@Injectable({
  providedIn: 'root',
})
export class SCarousel {
  private readonly http = inject(HttpClient);
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
      map((data) => {
        const list = Array.isArray(data) ? data : data?.$values || [];
        return list.map(this.normalize);
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
