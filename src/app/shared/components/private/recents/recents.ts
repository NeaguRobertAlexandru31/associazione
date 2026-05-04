import { Component, inject, input, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActivityService } from '../../../../core/services/activity/activity';
import { Toolbar } from '../toolbar/toolbar';

export interface ActivityItem {
  id:    string;
  icon:  string;
  text:  string;
  time:  string;
  color: string;
}

const DISMISSED_KEY = 'acr_dismissed_activities';

function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveDismissed(set: Set<string>): void {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set]));
}

@Component({
  selector: 'app-recents',
  imports: [RouterLink, Toolbar],
  templateUrl: './recents.html',
  styleUrl: './recents.css',
})
export class Recents {
  private activityService = inject(ActivityService);

  limit          = input<number | null>(null);
  allowSelection = input<boolean>(false);

  allItems   = signal<ActivityItem[]>([]);
  loading    = signal(false);
  error      = signal(false);
  dismissed  = signal<Set<string>>(loadDismissed());
  checkedIds = signal<Set<string>>(new Set());

  readonly checkedCount = computed(() => this.checkedIds().size);

  readonly items = computed(() => {
    const visible = this.allItems().filter(a => !this.dismissed().has(a.id));
    const lim = this.limit();
    return lim !== null ? visible.slice(0, lim) : visible;
  });

  readonly hasMore = computed(() => {
    const lim = this.limit();
    const visible = this.allItems().filter(a => !this.dismissed().has(a.id));
    return lim !== null && visible.length > lim;
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.checkedIds.set(new Set());
    this.activityService.getRecent().subscribe({
      next: items => {
        this.allItems.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  toggleCheck(id: string, event: Event): void {
    event.stopPropagation();
    this.checkedIds.update(set => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  isChecked(id: string): boolean {
    return this.checkedIds().has(id);
  }

  onDismiss(): void {
    const ids = [...this.checkedIds()];
    this.dismissed.update(set => {
      const next = new Set(set);
      ids.forEach(id => next.add(id));
      saveDismissed(next);
      return next;
    });
    this.checkedIds.set(new Set());
  }
}
