import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { MenuItem, MenuM } from '../models/Menu';

@Injectable({
  providedIn: 'root',
})
export class SMenu {
  private readonly http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Menu`;

  add(model: MenuM): Observable<MenuM> {
    return this.http.post<MenuM>(this.apiUrl, model)
  }

  search(): Observable<MenuM[]> {
    return this.http.post<MenuM[]>(`${this.apiUrl}/Search`, {})
  }

  get(id: any): Observable<MenuM> {
    return this.http.get<MenuM>(`${this.apiUrl}/${id}`)
  }

  update(id: any, updateRequest: MenuM): Observable<MenuM> {
    return this.http.put<MenuM>(`${this.apiUrl}/${id}`, updateRequest);
  }

  delete(id: any): Observable<MenuM> {
    return this.http.delete<MenuM>(`${this.apiUrl}/${id}`);
  }

  generateTreeData(userId: any = ''): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(`${this.apiUrl}/GenerateTreeData?userId=${userId}`);
  }
  
}
