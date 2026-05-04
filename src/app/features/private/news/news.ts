import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Article, CreateArticleDto } from '../../../core/models/article.model';
import { ArticlesService } from '../../../core/services/articles/articles';
import { Toolbar } from '../../../shared/components/private/toolbar/toolbar';
import { environment } from '../../../../environments/environment';

interface ImagePreview {
  file:      File;
  preview:   string;
  uploading: boolean;
  url:       string | null;
  error:     boolean;
}

const CATEGORIES = ['cultura', 'letteratura', 'artigianato', 'comunita', 'educazione', 'tradizione', 'sociale'];

@Component({
  selector: 'app-news',
  imports: [FormsModule, Toolbar],
  templateUrl: './news.html',
  styleUrl: './news.css',
})
export class News implements OnInit {
  private articlesService = inject(ArticlesService);

  articles      = signal<Article[]>([]);
  loading       = signal(true);
  saving        = signal(false);
  deleting      = signal<string | null>(null);

  showModal     = signal(false);
  detailArticle = signal<Article | null>(null);

  checkedIds    = signal<Set<string>>(new Set());
  readonly checkedCount = computed(() => this.checkedIds().size);

  imagePreviews = signal<ImagePreview[]>([]);
  readonly allUploaded = computed(() =>
    this.imagePreviews().every(p => p.url !== null || p.error),
  );

  readonly categories = CATEGORIES;
  form: CreateArticleDto = { name: '', description: '', categories: [], images: [] };

  ngOnInit(): void {
    this.articlesService.getAll().subscribe({
      next: arts => { this.articles.set(arts); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
  }

  openCreate(): void {
    this.form = { name: '', description: '', categories: [], images: [] };
    this.clearPreviews();
    this.showModal.set(true);
  }

  closeCreate(): void { this.showModal.set(false); this.clearPreviews(); }

  openDetail(a: Article): void { this.detailArticle.set(a); }
  closeDetail(): void { this.detailArticle.set(null); }

  toggleCategory(cat: string): void {
    const idx = this.form.categories.indexOf(cat);
    idx === -1 ? this.form.categories.push(cat) : this.form.categories.splice(idx, 1);
  }

  hasCategory(cat: string): boolean { return this.form.categories.includes(cat); }

  // ── Image upload ──────────────────────────────────────────────────────

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.uploadFiles(Array.from(input.files));
    input.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const files = Array.from(event.dataTransfer?.files ?? []).filter(f => f.type.startsWith('image/'));
    if (files.length) this.uploadFiles(files);
  }

  onDragOver(event: DragEvent): void { event.preventDefault(); }

  private uploadFiles(files: File[]): void {
    const MAX_SIZE = 5 * 1024 * 1024;
    files = files.filter(f => {
      if (f.size > MAX_SIZE) { alert(`"${f.name}" supera il limite di 5 MB.`); return false; }
      return true;
    });
    if (!files.length) return;

    const newPreviews: ImagePreview[] = files.map(file => ({
      file, preview: URL.createObjectURL(file), uploading: true, url: null, error: false,
    }));
    this.imagePreviews.update(list => [...list, ...newPreviews]);

    this.articlesService.uploadImages(files).subscribe({
      next: ({ urls }) => {
        this.imagePreviews.update(list => {
          const updated = [...list];
          newPreviews.forEach((p, i) => {
            const idx = updated.indexOf(p);
            if (idx !== -1) updated[idx] = { ...updated[idx], uploading: false, url: urls[i] ?? null };
          });
          return updated;
        });
        this.syncFormImages();
      },
      error: () => {
        this.imagePreviews.update(list =>
          list.map(p => newPreviews.includes(p) ? { ...p, uploading: false, error: true } : p),
        );
      },
    });
  }

  removePreview(index: number): void {
    this.imagePreviews.update(list => {
      const updated = [...list];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
    this.syncFormImages();
  }

  private syncFormImages(): void {
    this.form.images = this.imagePreviews().filter(p => p.url !== null).map(p => p.url!);
  }

  private clearPreviews(): void {
    this.imagePreviews().forEach(p => URL.revokeObjectURL(p.preview));
    this.imagePreviews.set([]);
  }

  // ── Submit / Delete ───────────────────────────────────────────────────

  submit(): void {
    if (!this.form.name || !this.form.description) return;
    this.syncFormImages();
    this.saving.set(true);
    this.articlesService.create(this.form).subscribe({
      next: article => {
        this.articles.update(list => [article, ...list]);
        this.saving.set(false);
        this.closeCreate();
      },
      error: () => this.saving.set(false),
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

  isChecked(id: string): boolean { return this.checkedIds().has(id); }

  onDelete(singleId?: string): void {
    const ids = singleId ? [singleId] : [...this.checkedIds()];
    if (!ids.length) return;
    this.articlesService.deleteMany(ids).subscribe({
      next: () => {
        this.articles.update(list => list.filter(a => !ids.includes(a.id)));
        if (ids.includes(this.detailArticle()?.id ?? '')) this.closeDetail();
        this.checkedIds.set(new Set());
      },
    });
  }

  resolveImg(path: string): string {
    if (path.startsWith('http')) return path;
    return `${environment.apiUrl}${path}`;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('it-IT', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }
}
