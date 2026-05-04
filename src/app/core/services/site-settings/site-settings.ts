import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export const SITE_IMAGE_KEYS = [
  { key: 'img_home_hero',        label: 'Home — immagine hero',             fallback: '/img/hero.jpg' },
  { key: 'img_about_hero',       label: 'Chi siamo — immagine hero',        fallback: '/img/about-hero.jpg' },
  { key: 'img_events_hero',      label: 'Eventi — sfondo hero mobile',      fallback: '/img/member3.jpg' },
  { key: 'img_news_hero',        label: 'News — sfondo hero mobile',        fallback: '/img/member4.jpg' },
  { key: 'img_projects_hero',    label: 'Progetti — sfondo hero mobile',    fallback: '/img/member1.jpg' },
  { key: 'img_donations_hero',   label: 'Donazioni — sfondo hero mobile',   fallback: '/img/member2.jpg' },
  { key: 'img_contacts_hero',    label: 'Contatti — sfondo hero mobile',    fallback: '/img/about-hero.jpg' },
  { key: 'img_membership_hero',  label: 'Tesseramento — immagine hero',     fallback: '/img/hero.jpg' },
  { key: 'img_boutique_hero',    label: 'Boutique — immagine hero',         fallback: '/img/hero.jpg' },
  { key: 'img_membership_mos_1', label: 'Tesseramento — mosaico principale',fallback: '/img/hero.jpg' },
  { key: 'img_membership_mos_2', label: 'Tesseramento — mosaico alto destra',fallback: '/img/about-hero.jpg' },
  { key: 'img_membership_mos_3', label: 'Tesseramento — mosaico basso destra',fallback: '/img/member3.jpg' },
  { key: 'img_about_member_1',   label: 'Chi siamo — foto membro 1',        fallback: '/img/member1.jpg' },
  { key: 'img_about_member_2',   label: 'Chi siamo — foto membro 2',        fallback: '/img/member2.jpg' },
  { key: 'img_about_member_3',   label: 'Chi siamo — foto membro 3',        fallback: '/img/member3.jpg' },
  { key: 'img_about_member_4',   label: 'Chi siamo — foto membro 4',        fallback: '/img/member4.jpg' },
] as const;

export type SiteImageKey = typeof SITE_IMAGE_KEYS[number]['key'];

@Injectable({ providedIn: 'root' })
export class SiteSettingsService {
  private http    = inject(HttpClient);
  private base    = `${environment.apiUrl}/site-settings`;
  private _loaded = false;

  readonly settings = signal<Record<string, string>>({});

  load(): void {
    if (this._loaded) return;
    this._loaded = true;
    this.http.get<Record<string, string>>(this.base).subscribe({
      next: s => this.settings.set(s),
    });
  }

  img(key: SiteImageKey): string {
    const def = SITE_IMAGE_KEYS.find(k => k.key === key);
    return this.settings()[key] ?? def?.fallback ?? '';
  }

  set(key: string, value: string): Observable<void> {
    return this.http.put<void>(`${this.base}/${key}`, { value });
  }

  uploadImage(file: File): Observable<{ urls: string[] }> {
    const fd = new FormData();
    fd.append('files', file);
    return this.http.post<{ urls: string[] }>(`${environment.apiUrl}/uploads/settings`, fd);
  }
}
