import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BrandM } from '../models/Brand';

@Injectable({
  providedIn: 'root',
})
export class SBrand {
  private readonly http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Brand`;

  add(model: BrandM): Observable<BrandM> {
    return this.http.post<BrandM>(this.apiUrl, model)
  }

  get(id: any): Observable<BrandM> {
    return this.http.get<BrandM>(`${this.apiUrl}/${id}`);
  }

  search(id: any = 0): Observable<BrandM[]> {
    const reqBody = {
      "companyID": environment.companyCode,
      ...(id && id > 0 ? { id: id } : {})
    }
    return this.http.post<BrandM[]>(`${this.apiUrl}/Search`, reqBody)
  }

  update(id: any, updateRequest: BrandM): Observable<BrandM> {
    return this.http.put<BrandM>(`${this.apiUrl}/${id}`, updateRequest);
  }

  delete(id: any): Observable<BrandM> {
    return this.http.delete<BrandM>(`${this.apiUrl}/${id}`);
  }

}
