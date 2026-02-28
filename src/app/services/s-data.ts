import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SData {
  private http = inject(HttpClient);
  private jsonUrl = 'data.json';

  // Method to fetch JSON data
  getJsonData(): Observable<any> {
    return this.http.get<any>(this.jsonUrl);
  }

  // In data.service.ts
  getRegions(): Observable<any[]> {
    return this.http.get<any>(this.jsonUrl).pipe(
      map(data => data.region || [])
    );
  }

  getCitiesByRegion(regionName: string): Observable<any[]> {
    return this.http.get<any>(this.jsonUrl).pipe(
      map(data => {
        const cities = data.city || [];
        return cities.filter((city: any) => city.parent === regionName);
      })
    );
  }

  getAreasByCity(cityName: string): Observable<any[]> {
    return this.http.get<any>(this.jsonUrl).pipe(
      map(data => {
        const areas = data.area || [];
        return areas.filter((area: any) => area.parent === cityName);
      })
    );
  }
  // Method to fetch categories from JSON data
  // This method retrieves the categories from the JSON file and returns them as an observable array.
  getCategories(): Observable<any[]> {
    return this.http.get<any>(this.jsonUrl, {
      headers: new HttpHeaders({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      })
    }).pipe(
      map(data => {
        const categories = data.categories || [];
        return categories;
      })
    );
  }
  // Method to fetch brands from JSON data
  // This method retrieves the brands from the JSON file and returns them as an observable array.
  getBrands(): Observable<any[]> {
    return this.http.get<any>(this.jsonUrl, {
      headers: new HttpHeaders({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      })
    }).pipe(
      map(data => {
        const brands = data.brands || [];
        return brands;
      })
    );
  }
  // Method to fetch section permissions from is permitted or not
  // In your data service
  private publishSections = signal<any[]>([]);
  
  // Computed signal for permission checks
  isPermittedSignal(sectionName: string) {
    return () => this.publishSections().some(
      section => section.name.toLowerCase() === sectionName.toLowerCase()
    );
  }

  // Load sections once and cache them
  loadSections(): Observable<any[]> {
    return this.http.get<any>(this.jsonUrl, {
      headers: new HttpHeaders({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      })
    }).pipe(
      tap((data: any) => {
        this.publishSections.set(data.publishSections || []);
      })
    );
  }

  // Keep the original method for backward compatibility if needed
  isPermitted(sectionName: string): boolean {
    return this.publishSections().some(
      section => section.name.toLowerCase() === sectionName.toLowerCase()
    );
  }

  getDeliveryCharges(): Observable<any[]> {
    return this.http.get<any>(this.jsonUrl, {
      headers: new HttpHeaders({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      })
    }).pipe(
      map(data => {
        const deliveryCharges = data.DeliveryCharges || [];
        return deliveryCharges;
      })
    );
  }
  
}
