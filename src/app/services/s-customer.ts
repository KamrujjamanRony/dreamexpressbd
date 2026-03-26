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
    return this.http.post<CustomerM>(this.apiUrl, model)
  }

  search(id: any = null): Observable<CustomerM[]> {
    const body = {
      companyID: environment.companyCode,
      ...(id && { id })
    }
    return this.http.post<CustomerM[]>(`${this.apiUrl}/Search`, body)
  }

  update(id: any, updateRequest: CustomerM): Observable<CustomerM> {
    return this.http.put<CustomerM>(`${this.apiUrl}/${id}`, updateRequest);
  }

  delete(id: any): Observable<CustomerM> {
    return this.http.delete<CustomerM>(`${this.apiUrl}/${id}`);
  }

  login(phone: string, pass: string): Observable<CustomerM> {
    const body = { companyID: environment.companyCode, phone, pass };
    return this.http.post<CustomerM>(`${this.apiUrl}/Auth`, body);
  }
  
}
