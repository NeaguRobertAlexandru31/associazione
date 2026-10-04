import { Injectable } from '@angular/core';
import { init, trackEvent } from '@aptabase/web';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Analytics {
  init(): void {
    if (!environment.aptabaseKey) return;
    init(environment.aptabaseKey);
  }

  page(path: string): void {
    this.capture('screen_view', { path });
  }

  capture(event: string, properties?: Record<string, string | number | boolean>): void {
    if (!environment.aptabaseKey) return;
    trackEvent(event, properties);
  }

  identify(_userId: string, _properties?: Record<string, unknown>): void {
    // Aptabase è privacy-first e non supporta identify — no-op intenzionale
  }

  reset(): void {
    // Aptabase non ha sessioni persistenti — no-op intenzionale
  }
}
