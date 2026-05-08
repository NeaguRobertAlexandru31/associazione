import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PublicStats {
  soci: number;
  projects: number;
  events: number;
  articles: number;
}

@Injectable({ providedIn: 'root' })
export class StatsService {
  private http = inject(HttpClient);

  getPublic(): Observable<PublicStats> {
    return this.http.get<PublicStats>(`${environment.apiUrl}/stats`);
  }
}
