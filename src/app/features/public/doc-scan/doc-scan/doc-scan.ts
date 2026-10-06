import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DocScanService } from '../../../../core/services/doc-scan/doc-scan';
import { environment } from '../../../../../environments/environment';

type PageState = 'loading' | 'invalid' | 'expired' | 'already-used' | 'form' | 'uploading' | 'success' | 'error';

@Component({
  selector: 'app-doc-scan',
  imports: [FormsModule],
  templateUrl: './doc-scan.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocScan implements OnInit {
  private route   = inject(ActivatedRoute);
  private service = inject(DocScanService);
  private http    = inject(HttpClient);

  state     = signal<PageState>('loading');
  token     = signal('');
  label     = signal<string | null>(null);

  name      = signal('');
  email     = signal('');
  file      = signal<File | null>(null);
  preview   = signal<string | null>(null);
  progress  = signal(0);

  ngOnInit(): void {
    const t = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.token.set(t);
    if (!t) { this.state.set('invalid'); return; }

    this.service.validate(t).subscribe({
      next: (rec) => {
        if (rec.usedAt) { this.state.set('already-used'); return; }
        this.label.set(rec.label);
        this.state.set('form');
      },
      error: (err) => {
        const msg = err?.error?.message ?? '';
        this.state.set(msg.includes('scaduto') ? 'expired' : 'invalid');
      },
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    this.file.set(f);
    const reader = new FileReader();
    reader.onload = () => this.preview.set(reader.result as string);
    reader.readAsDataURL(f);
  }

  async submit(): Promise<void> {
    const f = this.file();
    if (!f || !this.name().trim()) return;
    this.state.set('uploading');

    this.service.presign(this.token(), f.type || 'image/jpeg').subscribe({
      next: ({ uploadUrl, key }) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', f.type || 'image/jpeg');
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) this.progress.set(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status === 200) {
            const fileUrl = `${environment.cdnUrl}/${key}`;
            this.service.submit(this.token(), {
              name: this.name().trim(),
              email: this.email().trim() || undefined,
              fileUrl,
              fileName: f.name,
              fileSize: f.size,
            }).subscribe({
              next: () => this.state.set('success'),
              error: () => this.state.set('error'),
            });
          } else {
            this.state.set('error');
          }
        };
        xhr.onerror = () => this.state.set('error');
        xhr.send(f);
      },
      error: () => this.state.set('error'),
    });
  }
}
