import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DocScanService, DocScanToken } from '../../../../core/services/doc-scan/doc-scan';
import { Toolbar } from '../../../../shared/components/private/toolbar/toolbar';

@Component({
  selector: 'app-doc-scan',
  imports: [FormsModule, Toolbar],
  templateUrl: './doc-scan.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocScan implements OnInit {
  private service = inject(DocScanService);

  tokens    = signal<DocScanToken[]>([]);
  loading   = signal(true);
  creating  = signal(false);
  newLabel  = signal('');
  copiedId  = signal<string | null>(null);

  readonly baseUrl = window.location.origin;

  readonly pending   = computed(() => this.tokens().filter(t => !t.usedAt && new Date(t.expiresAt) > new Date()));
  readonly used      = computed(() => this.tokens().filter(t => !!t.usedAt));
  readonly expired   = computed(() => this.tokens().filter(t => !t.usedAt && new Date(t.expiresAt) <= new Date()));

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.service.getTokens().subscribe({
      next: (t) => { this.tokens.set(t); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  createToken(): void {
    this.creating.set(true);
    this.service.createToken(this.newLabel().trim() || undefined).subscribe({
      next: (t) => {
        this.tokens.update(list => [t, ...list]);
        this.newLabel.set('');
        this.creating.set(false);
      },
      error: () => this.creating.set(false),
    });
  }

  getLink(token: string): string {
    return `${this.baseUrl}/doc-scan?token=${token}`;
  }

  copy(token: DocScanToken): void {
    navigator.clipboard.writeText(this.getLink(token.token));
    this.copiedId.set(token.id);
    setTimeout(() => this.copiedId.set(null), 2000);
  }

  delete(id: string): void {
    this.service.deleteToken(id).subscribe({
      next: () => this.tokens.update(list => list.filter(t => t.id !== id)),
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  formatSize(bytes: number | null): string {
    if (!bytes) return '—';
    return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
}
