import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable, map } from 'rxjs';
import { ContactM, ContactUsM } from '../models/Contact';

@Injectable({
  providedIn: 'root',
})
export class SContact {
  private readonly http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/ContactUs`;

  add(model: ContactM): Observable<ContactM> {
    return this.http.post<any>(this.apiUrl, model).pipe(map(this.normalize));
  }

  get(id: any): Observable<ContactM> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(map(this.normalize));
  }

  update(id: any, updateRequest: any): Observable<ContactM> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, updateRequest).pipe(map(this.normalize));
  }

  delete(id: any): Observable<ContactM> {
    return this.http.delete<ContactM>(`${this.apiUrl}/${id}`);
  }

  submitContactUs(model: ContactUsM): Observable<any> {
    return this.http.post(`${this.apiUrl}/message`, model);
  }

  private normalize(raw: any): ContactM {
    const data = raw?.data || raw || {};
    return {
      id: data.id,
      companyID: data.companyID,
      facebookLink: data.facebookLink || '',
      iLink: data.iLink || '',
      yLink: data.yLink || '',
      wNum: data.wNum || '',
      lat: data.lat || 0,
      lng: data.lng || 0,
      mapUrl: data.mapUrl || '',
      othersLink1: data.othersLink1 || '',
      othersLink2: data.othersLink2 || '',
      quickInfo: data.quickInfo || [],
      faqs: data.faqs || [],
      contactCards: data.contactCards || [],
      deliveryCharges: data.deliveryCharges || [],
    };
  }

}
