import { Injectable, inject, signal } from '@angular/core';
import { ContactService } from './contact';

@Injectable({ providedIn: 'root' })
export class UnreadCountService {
  private contactService = inject(ContactService);

  readonly count = signal(0);

  load(): void {
    this.contactService.getUnreadCount().subscribe({
      next: n => this.count.set(n),
    });
  }

  decrement(): void {
    this.count.update(n => Math.max(0, n - 1));
  }
}
