import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreateRegistrationRequest, RegistrationResult } from '../../models/registration.model';

@Injectable({ providedIn: 'root' })
export class RegistrationsService {
  private http = inject(HttpClient);

  create(dto: CreateRegistrationRequest): Observable<RegistrationResult> {
    return this.http.post<RegistrationResult>(`${environment.apiUrl}/api/registrations`, dto);
  }
}
