import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export const PLACEHOLDER_KEYS = [
  {
    key:         'placeholder_page_hero',
    label:       'Hero pagine',
    description: 'Sfondo di default per Home, Chi siamo, News, Eventi, Progetti, Donazioni, Contatti, Tesseramento, Boutique',
  },
  {
    key:         'placeholder_member',
    label:       'Foto membro',
    description: 'Avatar di default per i 4 membri nella pagina Chi siamo',
  },
  {
    key:         'placeholder_mosaic',
    label:       'Mosaico tesseramento',
    description: 'Default per i 3 riquadri del mosaico nella pagina Tesseramento',
  },
] as const;

export type PlaceholderKey = typeof PLACEHOLDER_KEYS[number]['key'];

export const SITE_IMAGE_KEYS = [
  { key: 'img_home_hero',        label: 'Home — immagine hero',              placeholderKey: 'placeholder_page_hero' },
  { key: 'img_about_hero',       label: 'Chi siamo — immagine hero',         placeholderKey: 'placeholder_page_hero' },
  { key: 'img_events_hero',      label: 'Eventi — sfondo hero mobile',       placeholderKey: 'placeholder_page_hero' },
  { key: 'img_news_hero',        label: 'News — sfondo hero mobile',         placeholderKey: 'placeholder_page_hero' },
  { key: 'img_projects_hero',    label: 'Progetti — sfondo hero mobile',     placeholderKey: 'placeholder_page_hero' },
  { key: 'img_donations_hero',   label: 'Donazioni — sfondo hero mobile',    placeholderKey: 'placeholder_page_hero' },
  { key: 'img_contacts_hero',    label: 'Contatti — sfondo hero mobile',     placeholderKey: 'placeholder_page_hero' },
  { key: 'img_membership_hero',  label: 'Tesseramento — immagine hero',      placeholderKey: 'placeholder_page_hero' },
  { key: 'img_boutique_hero',    label: 'Boutique — immagine hero',          placeholderKey: 'placeholder_page_hero' },
  { key: 'img_membership_mos_1', label: 'Tesseramento — mosaico principale', placeholderKey: 'placeholder_mosaic'    },
  { key: 'img_membership_mos_2', label: 'Tesseramento — mosaico alto destra',placeholderKey: 'placeholder_mosaic'    },
  { key: 'img_membership_mos_3', label: 'Tesseramento — mosaico basso destra',placeholderKey:'placeholder_mosaic'    },
  { key: 'img_about_member_1',   label: 'Chi siamo — foto membro 1',         placeholderKey: 'placeholder_member'    },
  { key: 'img_about_member_2',   label: 'Chi siamo — foto membro 2',         placeholderKey: 'placeholder_member'    },
  { key: 'img_about_member_3',   label: 'Chi siamo — foto membro 3',         placeholderKey: 'placeholder_member'    },
  { key: 'img_about_member_4',   label: 'Chi siamo — foto membro 4',         placeholderKey: 'placeholder_member'    },
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
    const s   = this.settings();
    const def = SITE_IMAGE_KEYS.find(k => k.key === key);
    return s[key] || (def?.placeholderKey ? s[def.placeholderKey] : '') || '';
  }

  placeholder(key: PlaceholderKey): string {
    return this.settings()[key] || '';
  }

  set(key: string, value: string): Observable<void> {
    return this.http.put<void>(`${this.base}/${key}`, { value });
  }

  uploadImage(file: File): Observable<{ urls: string[] }> {
    const fd = new FormData();
    fd.append('files', file);
    return this.http.post<{ urls: string[] }>(`${environment.apiUrl}/uploads/settings`, fd);
  }

  uploadPlaceholder(file: File): Observable<{ urls: string[] }> {
    const fd = new FormData();
    fd.append('files', file);
    return this.http.post<{ urls: string[] }>(`${environment.apiUrl}/uploads/placeholders`, fd);
  }
}
