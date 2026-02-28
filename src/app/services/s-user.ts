import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SUser {
  private readonly http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/User`;

  add(model: any): Observable<void> {
    return this.http.post<void>(this.apiUrl, model)
  }

  search(query: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/SearchUser?Search=${query}`, {});
  }

  update(id: string | number, updateUserRequest: any): Observable<any> {
    const req = {
      ...updateUserRequest,
      userId: id
    }
    return this.http.put<any>(`${this.apiUrl}/EditUser/${id}?userId=${id}`, req);
  }

  delete(id: string | number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/DeleteUser?id=${id}`);
  }
  
}
