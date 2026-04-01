import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { map, Observable } from 'rxjs';
import { BlogM } from '../models/Blog';

@Injectable({
    providedIn: 'root',
})
export class SBlog {
    private readonly http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/Blog`;

    add(model: any): Observable<BlogM> {
        return this.http.post<BlogM>(this.apiUrl, model);
    }

    get(id: any): Observable<BlogM> {
        return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
            map((res) => this.normalize(res?.data ?? res))
        );
    }

    search(id: any = 0, sl: string = '', heading: string = '', title: string = '', desc: string = ''): Observable<BlogM[]> {
        const reqBody = {
            companyID: environment.companyCode,
            ...(id && id > 0 ? { id: id } : {}),
            ...(sl ? { sl: sl.trim() } : {}),
            ...(heading ? { heading: heading.trim() } : {}),
            ...(title ? { title: title.trim() } : {}),
            ...(desc ? { desc: desc.trim() } : {}),
        };
        return this.http.post<any>(`${this.apiUrl}/Search`, reqBody).pipe(
            map((res) => {
                const list = Array.isArray(res) ? res : res?.data || res?.$values || [];
                return list.map(this.normalize);
            })
        );
    }

    update(id: any, model: any): Observable<BlogM> {
        return this.http.put<BlogM>(`${this.apiUrl}/${id}`, model);
    }

    delete(id: any): Observable<BlogM> {
        return this.http.delete<BlogM>(`${this.apiUrl}/${id}`);
    }

    private normalize(raw: any): BlogM {
        return {
            id: raw.id ?? raw.Id,
            companyID: raw.companyID ?? raw.CompanyID ?? raw.companyId ?? raw.CompanyId,
            sl: raw.sl ?? raw.Sl ?? '',
            heading: raw.heading ?? raw.Heading ?? '',
            imageUrl: raw.imageUrl ?? raw.ImageUrl ?? '',
            vLink: raw.vLink ?? raw.VLink ?? '',
            dtls: (raw.dtls ?? raw.Dtls ?? raw.details ?? []).map((d: any) => ({
                title: d.title ?? d.Title ?? '',
                desc: d.desc ?? d.Desc ?? d.description ?? '',
                iUrl: d.iUrl ?? d.IUrl ?? '',
            })),
        };
    }
}
