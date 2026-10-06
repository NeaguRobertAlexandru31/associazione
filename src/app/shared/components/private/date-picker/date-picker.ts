import { ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, effect, input, model, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [NgClass, FormsModule],
  templateUrl: './date-picker.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatePicker {
  value       = model<string>('');
  placeholder = input('gg/mm/aaaa');

  open      = signal(false);
  monthView = signal(false);
  rawInput  = signal('');

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

  onManualInput(raw: string): void {
    this.rawInput.set(raw);
    // Accetta dd/mm/yyyy o ddmmyyyy
    const clean = raw.replace(/\D/g, '');
    if (clean.length === 8) {
      const d = clean.slice(0, 2), m = clean.slice(2, 4), y = clean.slice(4, 8);
      const iso = `${y}-${m}-${d}`;
      const date = new Date(iso + 'T00:00:00');
      if (!isNaN(date.getTime()) && date.getFullYear() === +y) {
        this.value.set(iso);
        this.viewYear.set(+y);
        this.viewMonth.set(+m - 1);
      }
    } else if (raw === '') {
      this.value.set('');
    }
  }

  openCalendar(): void { this.open.set(true); }

  readonly selectedDay = computed(() => {
    const v = this.value();
    if (!v) return null;
    const d = new Date(v + 'T00:00:00');
    return d.getFullYear() === this.viewYear() && d.getMonth() === this.viewMonth()
      ? d.getDate() : null;
  });

  constructor(private el: ElementRef) {
    effect(() => {
      const v = this.value();
      if (v) {
        const [y, m, d] = v.split('-');
        this.rawInput.set(`${d}/${m}/${y}`);
      } else {
        this.rawInput.set('');
      }
    });
  }

  toggle(): void {
    this.open.update(v => !v);
    if (!this.open()) this.monthView.set(false);
  }

  toggleMonthView(): void { this.monthView.update(v => !v); }

  selectMonth(m: number): void {
    this.viewMonth.set(m);
    this.monthView.set(false);
  }

  prevYear(): void { this.viewYear.update(y => y - 1); }
  nextYear(): void { this.viewYear.update(y => y + 1); }

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
    if (!this.el.nativeElement.contains(e.target)) {
      this.open.set(false);
      this.monthView.set(false);
    }
  }
}
