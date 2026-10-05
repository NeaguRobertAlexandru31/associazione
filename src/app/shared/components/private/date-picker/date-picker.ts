import { ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, input, model, signal } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [NgClass],
  templateUrl: './date-picker.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatePicker {
  value = model<string>('');
  placeholder = input('gg/mm/aaaa');

  open = signal(false);

  private today = new Date();

  viewYear  = signal(this.today.getFullYear());
  viewMonth = signal(this.today.getMonth());

  readonly MONTHS = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
  readonly DAYS   = ['Lu','Ma','Me','Gi','Ve','Sa','Do'];

  readonly cells = computed(() => {
    const y = this.viewYear();
    const m = this.viewMonth();
    const first = new Date(y, m, 1).getDay();
    const offset = first === 0 ? 6 : first - 1;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  });

  readonly displayValue = computed(() => {
    const v = this.value();
    if (!v) return '';
    const [y, m, d] = v.split('-');
    return `${d}/${m}/${y}`;
  });

  readonly selectedDay = computed(() => {
    const v = this.value();
    if (!v) return null;
    const d = new Date(v + 'T00:00:00');
    return d.getFullYear() === this.viewYear() && d.getMonth() === this.viewMonth()
      ? d.getDate() : null;
  });

  constructor(private el: ElementRef) {}

  toggle(): void { this.open.update(v => !v); }

  prevMonth(): void {
    if (this.viewMonth() === 0) { this.viewMonth.set(11); this.viewYear.update(y => y - 1); }
    else this.viewMonth.update(m => m - 1);
  }

  nextMonth(): void {
    if (this.viewMonth() === 11) { this.viewMonth.set(0); this.viewYear.update(y => y + 1); }
    else this.viewMonth.update(m => m + 1);
  }

  select(day: number | null): void {
    if (!day) return;
    const m = String(this.viewMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    this.value.set(`${this.viewYear()}-${m}-${d}`);
    this.open.set(false);
  }

  isToday(day: number | null): boolean {
    if (!day) return false;
    return day === this.today.getDate()
      && this.viewMonth() === this.today.getMonth()
      && this.viewYear() === this.today.getFullYear();
  }

  @HostListener('document:click', ['$event'])
  onOutsideClick(e: MouseEvent): void {
    if (!this.el.nativeElement.contains(e.target)) this.open.set(false);
  }
}
