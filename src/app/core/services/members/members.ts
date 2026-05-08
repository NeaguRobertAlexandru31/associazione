import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DirettivoMember, MembersResponse, SocioMemberDetail, UpdateSocioRequest } from '../../models/member.model';

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

  updateSocio(id: string, dto: UpdateSocioRequest): Observable<SocioMemberDetail> {
    return this.http.patch<SocioMemberDetail>(`${API}/members/soci/${id}`, dto);
  }

  deleteSocio(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/members/soci/${id}`);
  }

  getAdmin(id: string): Observable<DirettivoMember> {
    return this.http.get<DirettivoMember>(`${API}/members/admin/${id}`);
  }

  updateAdminBoardRoles(id: string, boardRoles: string[]): Observable<DirettivoMember> {
    return this.http.patch<DirettivoMember>(`${API}/members/admin/${id}/board-role`, { boardRoles });
  }

  deleteAdmin(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/members/admin/${id}`);
  }
}
