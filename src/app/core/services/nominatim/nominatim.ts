import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';

export interface NominatimResult {
  place_id: number;
  display_name: string;
  address: {
    road?: string;
    house_number?: string;
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    state_district?: string;
    'ISO3166-2-lvl6'?: string;
  };
}

export interface AddressFields {
  street: string;
  zip: string;
  city: string;
  province: string;
}

@Injectable({ providedIn: 'root' })
export class NominatimService {
  private http = inject(HttpClient);

  search(query: string): Observable<NominatimResult[]> {
    if (!query || query.trim().length < 3) return of([]);
    const params = new HttpParams()
      .set('q', query)
      .set('format', 'json')
      .set('addressdetails', '1')
      .set('countrycodes', 'it')
      .set('limit', '6');
    return this.http.get<NominatimResult[]>(
      'https://nominatim.openstreetmap.org/search',
      { params, headers: { 'Accept-Language': 'it' } },
    );
  }

  extractFields(result: NominatimResult): AddressFields {
    const a = result.address;
    const street = [a.road, a.house_number].filter(Boolean).join(' ');
    const city = a.city ?? a.town ?? a.village ?? a.municipality ?? '';
    const province = this.extractProvince(a['ISO3166-2-lvl6'] ?? a.state_district ?? '');
    return { street, zip: a.postcode ?? '', city, province };
  }

  private extractProvince(raw: string): string {
    // ISO3166-2-lvl6 format: "IT-MI" → "MI"
    const match = raw.match(/IT-([A-Z]{2})$/);
    return match ? match[1] : raw.slice(0, 2).toUpperCase();
  }
}
