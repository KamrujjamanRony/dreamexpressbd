import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { TokenM } from '../models/TokenM';
import { CarouselM } from '../models/Carousel';

@Injectable({
  providedIn: 'root',
})
export class SToken {
  private readonly http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/DiscountToken`;

  add(model: TokenM): Observable<TokenM> {
    return this.http.post<TokenM>(this.apiUrl, model)
  }

  get(id: number): Observable<TokenM> {
    return this.http.get<TokenM>(`${this.apiUrl}/${id}`);
  }

  search(): Observable<TokenM[]> {
    return this.http.get<TokenM[]>(`${this.apiUrl}/Search`)
  }

  update(id: number, updateRequest: TokenM): Observable<TokenM> {
    return this.http.put<TokenM>(`${this.apiUrl}/${id}`, updateRequest);
  }

  delete(id: number): Observable<TokenM> {
    return this.http.delete<TokenM>(`${this.apiUrl}/${id}`);
  }
  
}
