import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable, map } from 'rxjs';
import { ContactM, DeliveryChargeM } from '../models/Contact';

@Injectable({
  providedIn: 'root',
})
export class SContact {
  private readonly http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Address`;

  add(model: ContactM): Observable<ContactM> {
    return this.http.post<ContactM>(this.apiUrl, model).pipe(map(this.normalize));
  }

  get(id: any): Observable<ContactM> {
    return this.http.get<ContactM>(`${this.apiUrl}/${id}`).pipe(map(this.normalize));
  }

  update(id: any, updateRequest: any): Observable<ContactM> {
    return this.http.put<ContactM>(`${this.apiUrl}/${id}`, updateRequest).pipe(map(this.normalize));
  }

  delete(id: any): Observable<ContactM> {
    return this.http.delete<ContactM>(`${this.apiUrl}/${id}`);
  }

  private normalize(data: any): ContactM {
    const raw = data || {};
    const charges = raw.deliveryCharges ?? raw.DeliveryCharges;
    const chargeList: DeliveryChargeM[] = (
      Array.isArray(charges) ? charges : charges?.$values || []
    ).map((c: any) => ({
      id: c.id ?? c.Id,
      name: c.name ?? c.Name ?? '',
      amount: c.amount ?? c.Amount ?? 0,
      isActive: c.isActive ?? c.IsActive ?? true,
      siteSettingId: c.siteSettingId ?? c.SiteSettingId,
    }));

    return {
      id: raw.id ?? raw.Id,
      companyID: raw.companyID ?? raw.CompanyID ?? raw.companyId ?? raw.CompanyId,
      address1: raw.address1 ?? raw.Address1 ?? '',
      address2: raw.address2 ?? raw.Address2 ?? '',
      email: raw.email ?? raw.Email ?? '',
      phoneNumber1: raw.phoneNumber1 ?? raw.PhoneNumber1 ?? '',
      phoneNumber2: raw.phoneNumber2 ?? raw.PhoneNumber2 ?? '',
      phoneNumber3: raw.phoneNumber3 ?? raw.PhoneNumber3 ?? '',
      facebookLink: raw.facebookLink ?? raw.FacebookLink ?? '',
      othersLink1: raw.othersLink1 ?? raw.OthersLink1 ?? '',
      othersLink2: raw.othersLink2 ?? raw.OthersLink2 ?? '',
      deliveryCharges: chargeList,
    };
  }

}
