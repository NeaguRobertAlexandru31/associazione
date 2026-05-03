import { Component, inject } from '@angular/core';
import { UnreadCountService } from '../../../core/services/contact/unread-count';
import { Messages } from '../../../shared/components/private/messages/messages';

@Component({
  selector: 'app-messagges',
  imports: [Messages],
  templateUrl: './messagges.html',
  styleUrl: './messagges.css',
})
export class Messagges {
  private unreadCount = inject(UnreadCountService);

  onMessageRead(): void {
    this.unreadCount.decrement();
  }

  onMessagesDeleted(): void {
    this.unreadCount.load();
  }
}
