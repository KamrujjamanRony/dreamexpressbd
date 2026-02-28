import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SBrand {
  private readonly http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Brand`;

  add(model: any): Observable<any> {
    return this.http.post<void>(this.apiUrl, model)
  }

  search(): Observable<any> {
    return this.http.get<any[]>(`${this.apiUrl}`)
  }

  update(id: any, updateRequest: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, updateRequest);
  }

  delete(id: any): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
  
}
