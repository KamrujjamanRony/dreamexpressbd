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

  search(id=0, code='', isActive=true): Observable<TokenM[]> {
    const params: any = {};
    params.companyID = environment.companyCode;
    if (id) params.id = id;
    if (code) params.code = code;
    if (isActive !== undefined) params.isActive = isActive;
    return this.http.post<TokenM[]>(`${this.apiUrl}/Search`, params);
  }

  update(id: any, updateRequest: TokenM): Observable<TokenM> {
    return this.http.put<TokenM>(`${this.apiUrl}/${id}`, updateRequest);
  }

  delete(id: any): Observable<TokenM> {
    return this.http.delete<TokenM>(`${this.apiUrl}/${id}`);
  }
  
}
