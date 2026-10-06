import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreateRegistrationRequest, RegistrationResult } from '../../models/registration.model';

@Injectable({ providedIn: 'root' })
export class RegistrationsService {
  private http = inject(HttpClient);

  checkFiscalCode(fiscalCode: string): Observable<{ exists: boolean }> {
    return this.http.get<{ exists: boolean }>(`${environment.apiUrl}/api/registrations/check-fiscal-code`, {
      params: { fiscalCode: fiscalCode.toUpperCase() },
    });
  }

  create(dto: CreateRegistrationRequest): Observable<RegistrationResult> {
    return this.http.post<RegistrationResult>(`${environment.apiUrl}/api/registrations`, dto);
  }
}
