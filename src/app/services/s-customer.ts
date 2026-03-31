import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { CustomerM } from '../models/Customer';

@Injectable({
  providedIn: 'root',
})
export class SCustomer {
  private readonly http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/CustomerLogIn`;

  add(model: CustomerM): Observable<CustomerM> {
    return this.http.post<any>(this.apiUrl, model).pipe(map(this.unwrap));
  }

  search(id: any = null): Observable<CustomerM[]> {
    const body = {
      companyID: environment.companyCode,
      ...(id && { id })
    }
    return this.http.post<any>(`${this.apiUrl}/Search`, body).pipe(
      map(raw => {
        const data = raw?.data ?? raw;
        return Array.isArray(data) ? data : [data];
      })
    );
  }

  update(id: any, updateRequest: CustomerM): Observable<CustomerM> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, updateRequest).pipe(map(this.unwrap));
  }

  delete(id: any): Observable<CustomerM> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(map(this.unwrap));
  }

  login(phone: string, pass: string): Observable<CustomerM> {
    const body = { companyID: environment.companyCode, phone, pass };
    return this.http.post<any>(`${this.apiUrl}/Auth`, body).pipe(map(this.unwrap));
  }

  private unwrap(raw: any): CustomerM {
    return raw?.data ?? raw;
  }
}
