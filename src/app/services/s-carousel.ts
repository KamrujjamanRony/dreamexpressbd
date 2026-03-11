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

  add(model: CarouselM): Observable<CarouselM> {
    return this.http.post<CarouselM>(this.apiUrl, model)
  }

  get(id: number): Observable<CarouselM> {
    return this.http.get<CarouselM>(`${this.apiUrl}/${id}`);
  }

  search(): Observable<CarouselM[]> {
    return this.http.get<CarouselM[]>(`${this.apiUrl}/Search`)
  }

  update(id: number, updateRequest: CarouselM): Observable<CarouselM> {
    return this.http.put<CarouselM>(`${this.apiUrl}/${id}`, updateRequest);
  }

  delete(id: number): Observable<CarouselM> {
    return this.http.delete<CarouselM>(`${this.apiUrl}/${id}`);
  }
  
}
