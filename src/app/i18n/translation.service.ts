import { Injectable, signal } from '@angular/core';
import it from '../core/i18n/it.json';
import ro from '../core/i18n/ro.json';

export type Lang = 'it' | 'ro';

const TRANSLATIONS: Record<Lang, Record<string, unknown>> = { it, ro };

@Injectable({ providedIn: 'root' })
export class TranslationService {
  readonly currentLang = signal<Lang>('it');

  private get translations(): Record<string, unknown> {
    return TRANSLATIONS[this.currentLang()];
  }

  setLang(lang: Lang): void {
    this.currentLang.set(lang);
  }

  translate(key: string): string {
    const parts = key.split('.');
    let current: unknown = this.translations;
    for (const part of parts) {
      if (current == null || typeof current !== 'object') return key;
      current = (current as Record<string, unknown>)[part];
    }
    return typeof current === 'string' ? current : key;
  }
}
