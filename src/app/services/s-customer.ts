import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class SCustomer {
  private readonly http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/ECommerceUser`;

  add(model: any): Observable<any> {
    return this.http.post(this.apiUrl, model,
      { responseType: 'text' })
  }

  search(): Observable<any> {
    return this.http.get<any[]>(`${this.apiUrl}`)
  }

  get(id: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  update(id: any, updateRequest: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, updateRequest,
      { responseType: 'text' });
  }

  delete(id: any): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
  
}
