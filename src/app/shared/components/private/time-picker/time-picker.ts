import { ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, model, signal } from '@angular/core';

@Component({
  selector: 'app-time-picker',
  standalone: true,
  imports: [],
  templateUrl: './time-picker.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimePicker {
  value = model<string>('');

  open = signal(false);

  readonly hours   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  readonly minutes = ['00', '15', '30', '45'];

  readonly selectedHour = computed(() => this.value().split(':')[0] ?? '');
  readonly selectedMin  = computed(() => this.value().split(':')[1] ?? '');

  readonly displayValue = computed(() => this.value() || '');

  constructor(private el: ElementRef) {}

  toggle(): void { this.open.update(v => !v); }

  selectHour(h: string): void {
    const m = this.selectedMin() || '00';
    this.value.set(`${h}:${m}`);
  }

  selectMinute(m: string): void {
    const h = this.selectedHour() || '08';
    this.value.set(`${h}:${m}`);
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  onOutsideClick(e: MouseEvent): void {
    if (!this.el.nativeElement.contains(e.target)) this.open.set(false);
  }
}
