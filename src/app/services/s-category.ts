import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable, map } from 'rxjs';
import { CategoryM } from '../models/Category';

@Injectable({
  providedIn: 'root',
})
export class SCategory {
  private readonly http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Item`;

  add(model: FormData): Observable<CategoryM> {
    return this.http.post<CategoryM>(this.apiUrl, model);
  }

  search(): Observable<CategoryM[]> {
    const reqBody = { companyID: environment.companyCode };
    return this.http.post<any>(`${this.apiUrl}/Search`, reqBody).pipe(
      map((data) => {
        const list = Array.isArray(data) ? data : data?.$values || [];
        return list.map(this.normalize);
      })
    );
  }

  update(id: any, updateRequest: FormData): Observable<CategoryM> {
    return this.http.put<CategoryM>(`${this.apiUrl}/${id}`, updateRequest);
  }

  delete(id: any): Observable<CategoryM> {
    return this.http.delete<CategoryM>(`${this.apiUrl}/${id}`);
  }

  private normalize(raw: any): CategoryM {
    return {
      id: raw.id ?? raw.Id,
      companyID: raw.companyID ?? raw.CompanyID ?? raw.companyId ?? raw.CompanyId,
      slItem: raw.slItem ?? raw.SLItem ?? raw.SlItem ?? null,
      itemName: raw.itemName ?? raw.ItemName ?? '',
      imageUrl: raw.imageUrl ?? raw.ImageUrl ?? '',
    };
  }
  
}
