import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SOrder {
    private apiUrl = `${environment.apiUrl}/Orders`;
    private http = inject(HttpClient);

    add(order: any): Observable<any> {
        return this.http.post<any>(this.apiUrl, order);
    }

    search(reqBody?: any, status?: any): Observable<any[]> {
        // Add status to request body only if it's provided
        if (status !== undefined && status !== null && status !== 'null') {
            reqBody.orderStatus = status;
        }
        return this.http.post<any[]>(`${this.apiUrl}/searchOrder`, reqBody);
    }

    getByUser(userId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/${userId}`);
    }

    getById(orderId: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/order/${orderId}`);
    }

    updateStatus(id: string, orderStatus: any): Observable<any> {
        // Prepare update data
        const updateRequest: Partial<any> = { orderStatus };
        if (orderStatus == 'Delivered' || orderStatus == 3) {
            updateRequest['deliveredDate'] = new Date().toISOString();
        }
        return this.http.put<any>(`${this.apiUrl}/status/${id}`, updateRequest);
    }

    update(id: string, updateRequest: Partial<any>): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${id}`, updateRequest);
    }

    delete(id: string): Observable<string> {
        return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
    }
  
}
