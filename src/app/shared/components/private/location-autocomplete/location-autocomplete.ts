import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, model, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, switchMap, catchError, of } from 'rxjs';

interface NominatimResult {
  display_name: string;
  name?: string;
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
  };
}

@Component({
  selector: 'app-location-autocomplete',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './location-autocomplete.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocationAutocomplete {
  value = model<string>('');

  private http = inject(HttpClient);
  private search$ = new Subject<string>();

  suggestions = signal<string[]>([]);
  loading     = signal(false);
  open        = signal(false);

  constructor(private el: ElementRef) {
    this.search$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(q => {
        if (q.length < 2) { this.suggestions.set([]); this.loading.set(false); return of(null); }
        this.loading.set(true);
        return this.http.get<NominatimResult[]>(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6&countrycodes=it&accept-language=it`,
          { headers: { 'Accept-Language': 'it' } }
        ).pipe(catchError(() => of(null)));
      }),
    ).subscribe(res => {
      this.loading.set(false);
      if (!res) return;
      const labels = res.map(r => this.formatResult(r)).filter(Boolean) as string[];
      this.suggestions.set([...new Set(labels)]);
      this.open.set(labels.length > 0);
    });
  }

  onInput(raw: string): void {
    this.value.set(raw);
    this.search$.next(raw);
  }

  select(label: string): void {
    this.value.set(label);
    this.suggestions.set([]);
    this.open.set(false);
  }

  private formatResult(r: NominatimResult): string {
    const a = r.address ?? {};
    const parts: string[] = [];
    if (r.name) parts.push(r.name);
    if (a.road) parts.push(a.house_number ? `${a.road} ${a.house_number}` : a.road);
    const city = a.city ?? a.town ?? a.village ?? a.municipality;
    if (city) parts.push(city);
    return parts.length ? parts.join(', ') : r.display_name.split(',').slice(0, 3).join(',').trim();
  }

  @HostListener('document:click', ['$event'])
  onOutsideClick(e: MouseEvent): void {
    if (!this.el.nativeElement.contains(e.target)) this.open.set(false);
  }
}
