import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SSetting {
  private baseURL = `${environment.apiUrl}/SiteSetting`;
  private http = inject(HttpClient);

  get(id: number): Observable<any> {
    return this.http.get(`${this.baseURL}/${id}`);
  }

  create(data: any): Observable<any> {
    return this.http.post(`${this.baseURL}`, data);
  }

  update(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseURL}/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.baseURL}/${id}`);
  }
  
}
