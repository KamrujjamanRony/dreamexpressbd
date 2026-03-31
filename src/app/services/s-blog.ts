import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { map, Observable, switchMap, of } from 'rxjs';
import { BlogM } from '../models/Blog';
import { SGallery } from './s-gallery';

@Injectable({
    providedIn: 'root',
})
export class SBlog {
    private readonly http = inject(HttpClient);
    private readonly galleryService = inject(SGallery);
    private apiUrl = `${environment.apiUrl}/Blog`;

    add(model: any): Observable<BlogM> {
        return this.http.post<BlogM>(this.apiUrl, model);
    }

    get(id: any): Observable<BlogM> {
        return this.http.get<BlogM>(`${this.apiUrl}/${id}`);
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
            switchMap((res) => {
                const list = Array.isArray(res) ? res : res?.data || res?.$values || [];
                const blogs: BlogM[] = list.map(this.normalize);
                const allGalleryIds = new Set<string>();
                for (const b of blogs) {
                    if (b.galleryId) allGalleryIds.add(b.galleryId);
                    for (const d of b.dtls || []) {
                        if (d.iUrl) allGalleryIds.add(d.iUrl);
                    }
                }
                if (allGalleryIds.size === 0) return of(blogs);
                return this.galleryService.search().pipe(
                    map(gallery => {
                        const urlMap = new Map(gallery.map(g => [g.id, g.imageUrl]));
                        return blogs.map(b => ({
                            ...b,
                            imageUrl: b.galleryId ? urlMap.get(b.galleryId) || '' : '',
                            dtls: (b.dtls || []).map(d => ({
                                ...d,
                                imageUrl: d.iUrl ? urlMap.get(d.iUrl) || '' : '',
                            })),
                        }));
                    })
                );
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
            galleryId: raw.imageUrl ?? raw.ImageUrl ?? '',
            imageUrl: '',
            vLink: raw.vLink ?? raw.VLink ?? '',
            dtls: (raw.dtls ?? raw.Dtls ?? raw.details ?? []).map((d: any) => ({
                title: d.title ?? d.Title ?? '',
                desc: d.desc ?? d.Desc ?? d.description ?? '',
                iUrl: d.iUrl ?? d.IUrl ?? '',
                imageUrl: '',
            })),
        };
    }
}
