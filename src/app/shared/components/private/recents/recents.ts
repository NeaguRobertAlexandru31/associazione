import { Component, inject, signal } from '@angular/core';
import { ActivityService } from '../../../../core/services/activity/activity';

export interface ActivityItem {
  icon: string;
  text: string;
  time: string;
  color: string;
}

@Component({
  selector: 'app-recents',
  imports: [],
  templateUrl: './recents.html',
  styleUrl: './recents.css',
})
export class Recents {
  private activityService = inject(ActivityService);

  items   = signal<ActivityItem[]>([]);
  loading = signal(false);
  error   = signal(false);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.activityService.getRecent().subscribe({
      next: items => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
