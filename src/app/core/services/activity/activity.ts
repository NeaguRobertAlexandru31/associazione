import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ActivityItem } from '../../../../app/shared/components/private/recents/recents';

interface ActivityDto {
  type: string;
  icon: string;
  text: string;
  color: string;
  date: string;
}

function formatTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 60) return minutes <= 1 ? 'Adesso' : `${minutes}min fa`;
  if (hours < 24) return `${hours}h fa`;
  if (days === 1) return 'Ieri';
  return `${days}gg fa`;
}

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private http = inject(HttpClient);

  getRecent(): Observable<ActivityItem[]> {
    return this.http
      .get<ActivityDto[]>(`${environment.apiUrl}/activity`)
      .pipe(
        map(items =>
          items.map(item => ({
            icon:  item.icon,
            text:  item.text,
            color: item.color,
            time:  formatTime(new Date(item.date)),
          })),
        ),
      );
  }
}
