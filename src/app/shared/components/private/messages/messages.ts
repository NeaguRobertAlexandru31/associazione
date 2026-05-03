import { Component, EventEmitter, OnInit, Output, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContactMessage, ContactService } from '../../../../core/services/contact/contact';
import { Toolbar } from '../toolbar/toolbar';

@Component({
  selector: 'app-messages',
  imports: [Toolbar, FormsModule],
  templateUrl: './messages.html',
})
export class Messages implements OnInit {
  private contactService = inject(ContactService);

  @Output() messageRead     = new EventEmitter<void>();
  @Output() messagesDeleted = new EventEmitter<void>();

  messages  = signal<ContactMessage[]>([]);
  selected  = signal<ContactMessage | null>(null);
  loading   = signal(true);
  deleting  = signal(false);

  checkedIds = signal<Set<string>>(new Set());
  readonly checkedCount = computed(() => this.checkedIds().size);

  replyText   = '';
  replySending = signal(false);
  replyError   = signal(false);
  replySent    = signal(false);

  ngOnInit(): void {
    this.contactService.getAll().subscribe({
      next: msgs => { this.messages.set(msgs); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
  }

  open(msg: ContactMessage): void {
    this.selected.set(msg);
    this.replyText = '';
    this.replyError.set(false);
    this.replySent.set(false);
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

  sendReply(): void {
    const msg = this.selected();
    if (!msg || !this.replyText.trim()) return;
    this.replySending.set(true);
    this.replyError.set(false);
    this.contactService.reply(msg.id, this.replyText.trim()).subscribe({
      next: () => {
        this.replySending.set(false);
        this.replySent.set(true);
        this.replyText = '';
      },
      error: () => {
        this.replySending.set(false);
        this.replyError.set(true);
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

  onDelete(): void {
    const ids = [...this.checkedIds()];
    if (!ids.length) return;
    this.deleting.set(true);
    this.contactService.deleteMany(ids).subscribe({
      next: () => {
        this.messages.update(list => list.filter(m => !ids.includes(m.id)));
        if (ids.includes(this.selected()?.id ?? '')) this.selected.set(null);
        this.checkedIds.set(new Set());
        this.deleting.set(false);
        this.messagesDeleted.emit();
      },
      error: () => this.deleting.set(false),
    });
  }

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
