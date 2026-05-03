import { Component, inject, input, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActivityService } from '../../../../core/services/activity/activity';

export interface ActivityItem {
  icon: string;
  text: string;
  time: string;
  color: string;
}

@Component({
  selector: 'app-recents',
  imports: [RouterLink],
  templateUrl: './recents.html',
  styleUrl: './recents.css',
})
export class Recents {
  private activityService = inject(ActivityService);

  limit = input<number | null>(null);

  allItems = signal<ActivityItem[]>([]);
  loading  = signal(false);
  error    = signal(false);

  readonly items = computed(() => {
    const lim = this.limit();
    return lim !== null ? this.allItems().slice(0, lim) : this.allItems();
  });

  readonly hasMore = computed(() => {
    const lim = this.limit();
    return lim !== null && this.allItems().length > lim;
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
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
}
