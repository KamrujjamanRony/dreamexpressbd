import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { map, Observable } from 'rxjs';
import { AboutUsM } from '../models/AboutUs';

@Injectable({
  providedIn: 'root',
})
export class SAbout {
  private readonly http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/AboutUs`;

  add(model: Partial<AboutUsM>): Observable<AboutUsM> {
    return this.http.post<any>(this.apiUrl, model).pipe(
      map(res => this.normalize(res))
    );
  }

  get(id: any): Observable<AboutUsM> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(res => this.normalize(res))
    );
  }

  update(id: any, model: Partial<AboutUsM>): Observable<AboutUsM> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, model).pipe(
      map(res => this.normalize(res))
    );
  }

  delete(id: any): Observable<AboutUsM> {
    return this.http.delete<AboutUsM>(`${this.apiUrl}/${id}`);
  }

  private normalize(res: any): AboutUsM {
    const data = res?.data || res;
    return {
      ...data,
      info: Array.isArray(data.info) ? data.info : data.info?.$values || [],
    };
  }
}
