import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { MembersResponse } from '../../models/member.model';

@Injectable({ providedIn: 'root' })
export class MembersService {
  private http = inject(HttpClient);

  getAll(): Observable<MembersResponse> {
    return this.http.get<MembersResponse>(`${environment.apiUrl}/members`);
  }
}
