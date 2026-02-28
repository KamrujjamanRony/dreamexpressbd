import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SMenu {
  private readonly http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Menu`;

  add(model: any): Observable<any> {
    return this.http.post<void>(this.apiUrl, model)
  }

  search(): Observable<any> {
    return this.http.post<any[]>(`${this.apiUrl}/SearchMenu`, {})
  }

  get(id: any): Observable<any> {
    return this.http.post<any[]>(`${this.apiUrl}/GetById/${id}`, {})
  }

  update(id: any, updateRequest: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/EditMenu/${id}`, updateRequest);
  }

  delete(id: any): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/DeleteMenu?id=${id}`);
  }

  generateTreeData(userId: any = ''): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/GenerateTreeData?userId=${userId}`);
  }
  
}
