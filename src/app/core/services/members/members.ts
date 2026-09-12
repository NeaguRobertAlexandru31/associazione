import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { MemberDetail, MembersResponse, UpdateMemberRequest } from '../../models/member.model';

export interface DonationStats {
  count: number;
  total: number;
  thisMonthCount: number;
  thisMonthTotal: number;
}

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class MembersService {
  private http = inject(HttpClient);

  getAll(): Observable<MembersResponse> {
    return this.http.get<MembersResponse>(`${API}/members`);
  }

  getDonationStats(): Observable<DonationStats> {
    return this.http.get<DonationStats>(`${API}/members/donation-stats`);
  }

  getMember(id: string): Observable<MemberDetail> {
    return this.http.get<MemberDetail>(`${API}/members/${id}`);
  }

  updateMember(id: string, dto: UpdateMemberRequest): Observable<MemberDetail> {
    return this.http.patch<MemberDetail>(`${API}/members/${id}`, dto);
  }

  deleteMember(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/members/${id}`);
  }
}
