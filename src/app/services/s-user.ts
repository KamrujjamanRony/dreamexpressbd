import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { UserDeleteResponseM, UserFormM, UserFormResponseM, UserM, UsersM } from '../models/User';

@Injectable({
  providedIn: 'root',
})
export class SUser {
  private readonly http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/User`;

  add(model: UserFormM): Observable<UserFormResponseM> {
    return this.http.post<UserFormResponseM>(this.apiUrl, model)
  }

  search(userName: string = '', postBy: string = ''): Observable<UsersM[]> {
    const reqBody = {companyID: environment.companyCode, userName, postBy}
    return this.http.post<UsersM[]>(`${this.apiUrl}/Search`, reqBody);
  }

  get(id: number): Observable<UserM> {
    return this.http.get<UserM>(`${this.apiUrl}/${id}`);
  }

  update(id: number, updateRequest: UserFormM): Observable<UserFormResponseM> {
    const req = {
      ...updateRequest,
      userId: id
    }
    return this.http.put<UserFormResponseM>(`${this.apiUrl}/${id}`, req);
  }

  delete(id: number): Observable<UserDeleteResponseM> {
    return this.http.delete<UserDeleteResponseM>(`${this.apiUrl}/${id}`);
  }
  
}
