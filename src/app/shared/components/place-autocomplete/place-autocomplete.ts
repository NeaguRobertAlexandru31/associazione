import {
  Component, inject, signal, output, input, OnChanges,
  OnInit, OnDestroy, ElementRef, HostListener, SimpleChanges,
} from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject, switchMap, debounceTime, distinctUntilChanged, takeUntil, of } from 'rxjs';

interface NominatimPlace {
  place_id: number;
  display_name: string;
  address: {
    city?: string; town?: string; village?: string;
    municipality?: string; county?: string;
    state?: string; country?: string;
  };
  type: string;
  class: string;
}

@Component({
  selector: 'app-place-autocomplete',
  templateUrl: './place-autocomplete.html',
})
export class PlaceAutocomplete implements OnInit, OnChanges, OnDestroy {
  private http     = inject(HttpClient);
  private el       = inject(ElementRef);
  private destroy$ = new Subject<void>();
  private search$  = new Subject<string>();

  variant      = input<'public' | 'private'>('private');
  placeholder  = input('Es. Roma');
  initialValue = input('');

  placeSelected = output<string>();

  query   = signal('');
  results = signal<NominatimPlace[]>([]);
  loading = signal(false);
  open    = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialValue'] && this.initialValue()) {
      this.query.set(this.initialValue());
    }
  }

  ngOnInit(): void {
    if (this.initialValue()) this.query.set(this.initialValue());

    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => {
        if (!q || q.trim().length < 2) return of([]);
        this.loading.set(true);
        const params = new HttpParams()
          .set('q', q)
          .set('format', 'json')
          .set('addressdetails', '1')
          .set('featuretype', 'city')
          .set('countrycodes', 'it')
          .set('limit', '7');
        return this.http.get<NominatimPlace[]>(
          'https://nominatim.openstreetmap.org/search',
          { params, headers: { 'Accept-Language': 'it' } },
        );
      }),
      takeUntil(this.destroy$),
    ).subscribe({
      next: res => { this.results.set(res); this.loading.set(false); this.open.set(res.length > 0); },
      error: ()  => { this.loading.set(false); },
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  onInput(value: string): void {
    this.query.set(value);
    this.search$.next(value);
    if (!value) { this.results.set([]); this.open.set(false); }
  }

  select(r: NominatimPlace): void {
    const a = r.address;
    const name = a.city ?? a.town ?? a.village ?? a.municipality ?? r.display_name.split(',')[0];
    this.query.set(name);
    this.open.set(false);
    this.placeSelected.emit(name);
  }

  label(r: NominatimPlace): string {
    return r.display_name.split(',').slice(0, 3).join(',');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (!this.el.nativeElement.contains(e.target)) this.open.set(false);
  }
}
