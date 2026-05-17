import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { GalleryM } from '../models/Gallery';

@Injectable({
    providedIn: 'root',
})
export class SGallery {
    private readonly http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/ImageGallery`;

    add(model: FormData): Observable<GalleryM> {
        return this.http.post<GalleryM>(this.apiUrl, model);
    }

    search(id?: string, type?: string, description?: string, postBy?: string): Observable<GalleryM[]> {
        const reqBody = {
            id: id || '',
            "companyID": environment.companyCode,
            type: type || '',
            description: description || '',
            postBy: postBy || '',
        };

        return this.http.post<any>(`${this.apiUrl}/Search`, reqBody).pipe(
            map((res) => {
                const list = Array.isArray(res) ? res : res?.data || res?.$values || [];
                return list;
            })
        );
    }

    update(id: string, model: FormData): Observable<GalleryM> {
        return this.http.put<GalleryM>(`${this.apiUrl}/${id}`, model);
    }

    delete(id: string): Observable<GalleryM> {
        return this.http.delete<GalleryM>(`${this.apiUrl}/${id}`);
    }
}
