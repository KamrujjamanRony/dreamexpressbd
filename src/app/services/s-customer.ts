import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { CustomerM } from '../models/Customer';

@Injectable({
  providedIn: 'root',
})
export class SCustomer {
  private readonly http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/CustomerLogIn`;

  add(model: CustomerM): Observable<CustomerM> {
    return this.http.post<CustomerM>(this.apiUrl, model,
      { responseType: 'text' as 'json' })
  }

  search(): Observable<CustomerM[]> {
    return this.http.get<CustomerM[]>(`${this.apiUrl}/Search`)
  }

  get(id: number): Observable<CustomerM> {
    return this.http.get<CustomerM>(`${this.apiUrl}/${id}`);
  }

  update(id: number, updateRequest: CustomerM): Observable<CustomerM> {
    return this.http.put<CustomerM>(`${this.apiUrl}/${id}`, updateRequest,
      { responseType: 'text' as 'json' });
  }

  delete(id: number): Observable<CustomerM> {
    return this.http.delete<CustomerM>(`${this.apiUrl}/${id}`);
  }
  
}
