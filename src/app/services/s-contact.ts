import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { ContactM } from '../models/Contact';

@Injectable({
  providedIn: 'root',
})
export class SContact {
  private readonly http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Address`;

  add(model: ContactM): Observable<ContactM> {
    return this.http.post<ContactM>(this.apiUrl, model)
  }

  get(id: number): Observable<ContactM> {
    return this.http.get<ContactM>(`${this.apiUrl}/${id}`);
  }

  update(id: number, updateRequest: ContactM): Observable<ContactM> {
    return this.http.put<ContactM>(`${this.apiUrl}/${id}`, updateRequest);
  }

  delete(id: number): Observable<ContactM> {
    return this.http.delete<ContactM>(`${this.apiUrl}/${id}`);
  }
  
}
