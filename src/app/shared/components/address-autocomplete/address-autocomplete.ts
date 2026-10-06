import {
  Component, inject, signal, output, input,
  OnInit, OnDestroy, ElementRef, HostListener,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, switchMap, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { NominatimService, NominatimResult, AddressFields } from '../../../core/services/nominatim/nominatim';

@Component({
  selector: 'app-address-autocomplete',
  imports: [FormsModule],
  templateUrl: './address-autocomplete.html',
})
export class AddressAutocomplete implements OnInit, OnDestroy {
  private nominatim = inject(NominatimService);
  private el       = inject(ElementRef);
  private destroy$ = new Subject<void>();
  private search$  = new Subject<string>();

  variant = input<'public' | 'private'>('private');

  addressSelected = output<AddressFields>();

  query    = signal('');
  results  = signal<NominatimResult[]>([]);
  loading  = signal(false);
  open     = signal(false);

  ngOnInit(): void {
    this.search$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      switchMap(q => {
        this.loading.set(true);
        return this.nominatim.search(q);
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
    if (value.trim().length >= 3) this.search$.next(value);
    else { this.results.set([]); this.open.set(false); }
  }

  select(result: NominatimResult): void {
    const fields = this.nominatim.extractFields(result);
    this.query.set(fields.street || result.display_name.split(',')[0]);
    this.open.set(false);
    this.addressSelected.emit(fields);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (!this.el.nativeElement.contains(e.target)) this.open.set(false);
  }

  label(r: NominatimResult): string {
    return r.display_name.split(',').slice(0, 3).join(',');
  }
}
