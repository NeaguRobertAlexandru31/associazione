import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DirettivoMember, MembersResponse, SocioMemberDetail } from '../../models/member.model';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class MembersService {
  private http = inject(HttpClient);

  getAll(): Observable<MembersResponse> {
    return this.http.get<MembersResponse>(`${API}/members`);
  }

  getSocio(id: string): Observable<SocioMemberDetail> {
    return this.http.get<SocioMemberDetail>(`${API}/members/soci/${id}`);
  }

  getAdmin(id: string): Observable<DirettivoMember> {
    return this.http.get<DirettivoMember>(`${API}/members/admin/${id}`);
  }
}
