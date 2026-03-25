import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { CarouselM } from '../models/Carousel';

@Injectable({
  providedIn: 'root',
})
export class SCarousel {
  private readonly http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Carousel`;

  add(model: FormData): Observable<CarouselM> {
    return this.http.post<CarouselM>(this.apiUrl, model)
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
    return this.http.post<CarouselM[]>(`${this.apiUrl}/Search`, reqBody)
  }

  update(id: any, updateRequest: FormData): Observable<CarouselM> {
    return this.http.put<CarouselM>(`${this.apiUrl}/${id}`, updateRequest);
  }

  delete(id: any): Observable<CarouselM> {
    return this.http.delete<CarouselM>(`${this.apiUrl}/${id}`);
  }
  
}
