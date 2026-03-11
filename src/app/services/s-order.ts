import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrderM } from '../models/OrderM';

@Injectable({
    providedIn: 'root',
})
export class SOrder {
    private apiUrl = `${environment.apiUrl}/Orders`;
    private http = inject(HttpClient);

    add(order: OrderM): Observable<OrderM> {
        return this.http.post<OrderM>(this.apiUrl, order);
    }

    search(companyID: number, from: string = '', to: string = '', orderStatus: string = ''): Observable<OrderM[]> {
        const reqBody = { from, to, orderStatus, companyID };
        return this.http.post<OrderM[]>(`${this.apiUrl}/Search`, reqBody);
    }

    // getByUser(userId: number): Observable<OrderM[]> {
    //     return this.http.get<OrderM[]>(`${this.apiUrl}/${userId}`);
    // }

    get(orderId: number): Observable<OrderM> {
        return this.http.get<OrderM>(`${this.apiUrl}/${orderId}`);
    }

    // updateStatus(id: number, orderStatus: any): Observable<any> {
    //     // Prepare update data
    //     const updateRequest: Partial<OrderM> & { deliveredDate?: string } = { orderStatus };
    //     if (orderStatus == 'Delivered' || orderStatus == 3) {
    //         updateRequest['deliveredDate'] = new Date().toISOString();
    //     }
    //     return this.http.put<OrderM>(`${this.apiUrl}/status/${id}`, updateRequest);
    // }

    update(id: number, updateRequest: Partial<OrderM>): Observable<OrderM> {
        return this.http.put<OrderM>(`${this.apiUrl}/${id}`, updateRequest);
    }

    delete(id: number): Observable<OrderM> {
        return this.http.delete<OrderM>(`${this.apiUrl}/${id}`);
    }

}
