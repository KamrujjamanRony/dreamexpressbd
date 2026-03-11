import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { CategoryM } from '../models/Category';

@Injectable({
  providedIn: 'root',
})
export class SCategory {
  private readonly http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Item`;

  add(model: CategoryM): Observable<CategoryM> {
    return this.http.post<CategoryM>(this.apiUrl, model)
  }

  search(): Observable<CategoryM[]> {
    return this.http.get<CategoryM[]>(`${this.apiUrl}/Search`)
  }

  update(id: number, updateRequest: CategoryM): Observable<CategoryM> {
    return this.http.put<CategoryM>(`${this.apiUrl}/${id}`, updateRequest);
  }

  delete(id: number): Observable<CategoryM> {
    return this.http.delete<CategoryM>(`${this.apiUrl}/${id}`);
  }
  
}
