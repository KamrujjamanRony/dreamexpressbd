import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SCategory {
  private readonly http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Category`;

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
