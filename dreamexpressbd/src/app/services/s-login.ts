import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SLogin {

  private readonly http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  login(model: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/Authentication/Login`, model)
  }
  
}
