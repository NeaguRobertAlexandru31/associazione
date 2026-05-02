import { Component, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
import { ContactMessage, ContactService } from '../../../../core/services/contact/contact';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.html',
})
export class Messages implements OnInit {
  private contactService = inject(ContactService);

  @Output() messageRead = new EventEmitter<void>();

  messages  = signal<ContactMessage[]>([]);
  selected  = signal<ContactMessage | null>(null);
  loading   = signal(true);

  ngOnInit(): void {
    this.contactService.getAll().subscribe({
      next: msgs => { this.messages.set(msgs); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
  }

  open(msg: ContactMessage): void {
    this.selected.set(msg);
    if (!msg.read) {
      this.contactService.markRead(msg.id).subscribe(updated => {
        this.messages.update(list =>
          list.map(m => m.id === updated.id ? { ...m, read: true } : m),
        );
        this.messageRead.emit();
      });
    }
  }

  close(): void { this.selected.set(null); }

  unreadCount(): number {
    return this.messages().filter(m => !m.read).length;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('it-IT', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
}
