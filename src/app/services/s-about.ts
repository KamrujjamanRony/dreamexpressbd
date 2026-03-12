import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { AboutUsM } from '../models/AboutUs';

@Injectable({
  providedIn: 'root',
})
export class SAbout {
  private readonly http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/AboutUs`;

  add(model: AboutUsM): Observable<AboutUsM> {
    return this.http.post<AboutUsM>(this.apiUrl, model)
  }

  get(id: any): Observable<AboutUsM> {
    return this.http.get<AboutUsM>(`${this.apiUrl}/${id}`);
  }

  update(id: any, updateRequest: AboutUsM): Observable<AboutUsM> {
    return this.http.put<AboutUsM>(`${this.apiUrl}/${id}`, updateRequest);
  }

  delete(id: any): Observable<AboutUsM> {
    return this.http.delete<AboutUsM>(`${this.apiUrl}/${id}`);
  }
  
}
