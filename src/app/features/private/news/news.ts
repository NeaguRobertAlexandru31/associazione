import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Article, CreateArticleDto, CreateArticleBlockDto } from '../../../core/models/article.model';
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

interface FormBlock {
  subtitle:     string;
  paragraph:    string;
  imagePreview: ImagePreview | null;
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

  showModal     = signal(false);
  detailArticle = signal<Article | null>(null);

  checkedIds    = signal<Set<string>>(new Set());
  readonly checkedCount = computed(() => this.checkedIds().size);

  formBlocks   = signal<FormBlock[]>([{ subtitle: '', paragraph: '', imagePreview: null }]);
  coverPreview = signal<ImagePreview | null>(null);

  readonly allUploaded = computed(() =>
    (this.coverPreview() === null || this.coverPreview()!.url !== null || this.coverPreview()!.error) &&
    this.formBlocks().every(b => b.imagePreview === null || b.imagePreview.url !== null || b.imagePreview.error),
  );

  readonly hasValidBlock = computed(() =>
    this.formBlocks().some(b => b.paragraph.trim().length > 0),
  );

  readonly categories = CATEGORIES;
  form: CreateArticleDto = { name: '', categories: [], blocks: [], cover: undefined };

  ngOnInit(): void {
    this.articlesService.getAll().subscribe({
      next: arts => { this.articles.set(arts); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
  }

  openCreate(): void {
    this.form = { name: '', categories: [], blocks: [], cover: undefined };
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

  // ── Blocks ────────────────────────────────────────────────────────────

  addBlock(): void {
    this.formBlocks.update(list => [...list, { subtitle: '', paragraph: '', imagePreview: null }]);
  }

  removeBlock(index: number): void {
    this.formBlocks.update(list => {
      const updated = [...list];
      const ip = updated[index].imagePreview;
      if (ip) URL.revokeObjectURL(ip.preview);
      updated.splice(index, 1);
      return updated;
    });
  }

  updateBlockSubtitle(index: number, val: string): void {
    this.formBlocks.update(list => {
      const updated = [...list];
      updated[index] = { ...updated[index], subtitle: val };
      return updated;
    });
  }

  updateBlockParagraph(index: number, val: string): void {
    this.formBlocks.update(list => {
      const updated = [...list];
      updated[index] = { ...updated[index], paragraph: val };
      return updated;
    });
  }

  onBlockImageSelected(event: Event, blockIndex: number): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.uploadBlockImage(input.files[0], blockIndex);
    input.value = '';
  }

  onBlockImageDrop(event: DragEvent, blockIndex: number): void {
    event.preventDefault();
    const file = Array.from(event.dataTransfer?.files ?? []).find(f => f.type.startsWith('image/'));
    if (file) this.uploadBlockImage(file, blockIndex);
  }

  removeBlockImage(blockIndex: number): void {
    this.formBlocks.update(list => {
      const updated = [...list];
      const old = updated[blockIndex].imagePreview;
      if (old) URL.revokeObjectURL(old.preview);
      updated[blockIndex] = { ...updated[blockIndex], imagePreview: null };
      return updated;
    });
  }

  private uploadBlockImage(file: File, blockIndex: number): void {
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) { alert(`"${file.name}" supera il limite di 5 MB.`); return; }
    const preview: ImagePreview = { file, preview: URL.createObjectURL(file), uploading: true, url: null, error: false };
    this.formBlocks.update(list => {
      const updated = [...list];
      const old = updated[blockIndex].imagePreview;
      if (old) URL.revokeObjectURL(old.preview);
      updated[blockIndex] = { ...updated[blockIndex], imagePreview: preview };
      return updated;
    });
    this.articlesService.uploadImages([file]).subscribe({
      next: ({ urls }) => {
        this.formBlocks.update(list => {
          const updated = [...list];
          if (updated[blockIndex]?.imagePreview === preview) {
            updated[blockIndex] = { ...updated[blockIndex], imagePreview: { ...preview, uploading: false, url: urls[0] ?? null } };
          }
          return updated;
        });
      },
      error: () => {
        this.formBlocks.update(list => {
          const updated = [...list];
          if (updated[blockIndex]?.imagePreview === preview) {
            updated[blockIndex] = { ...updated[blockIndex], imagePreview: { ...preview, uploading: false, error: true } };
          }
          return updated;
        });
      },
    });
  }

  // ── Cover upload ──────────────────────────────────────────────────────

  onCoverSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.uploadCover(input.files[0]);
    input.value = '';
  }

  onCoverDrop(event: DragEvent): void {
    event.preventDefault();
    const file = Array.from(event.dataTransfer?.files ?? []).find(f => f.type.startsWith('image/'));
    if (file) this.uploadCover(file);
  }

  private uploadCover(file: File): void {
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) { alert(`"${file.name}" supera il limite di 5 MB.`); return; }
    const preview: ImagePreview = { file, preview: URL.createObjectURL(file), uploading: true, url: null, error: false };
    const old = this.coverPreview();
    if (old) URL.revokeObjectURL(old.preview);
    this.coverPreview.set(preview);
    this.articlesService.uploadImages([file]).subscribe({
      next: ({ urls }) => this.coverPreview.update(cp => cp ? { ...cp, uploading: false, url: urls[0] ?? null } : cp),
      error: ()        => this.coverPreview.update(cp => cp ? { ...cp, uploading: false, error: true } : cp),
    });
  }

  removeCover(): void {
    const cp = this.coverPreview();
    if (cp) URL.revokeObjectURL(cp.preview);
    this.coverPreview.set(null);
  }

  onDragOver(event: DragEvent): void { event.preventDefault(); }

  // ── Submit / Delete ───────────────────────────────────────────────────

  submit(): void {
    if (!this.form.name) return;
    const blocks: CreateArticleBlockDto[] = this.formBlocks()
      .filter(b => b.paragraph.trim())
      .map(b => ({
        subtitle:  b.subtitle.trim() || undefined,
        paragraph: b.paragraph,
        image:     b.imagePreview?.url ?? undefined,
      }));
    if (!blocks.length) return;
    this.saving.set(true);
    this.articlesService.create({ ...this.form, blocks, cover: this.coverPreview()?.url ?? undefined }).subscribe({
      next: article => {
        this.articles.update(list => [article, ...list]);
        this.saving.set(false);
        this.closeCreate();
      },
      error: () => this.saving.set(false),
    });
  }

  private clearPreviews(): void {
    this.formBlocks().forEach(b => { if (b.imagePreview) URL.revokeObjectURL(b.imagePreview.preview); });
    this.formBlocks.set([{ subtitle: '', paragraph: '', imagePreview: null }]);
    const cp = this.coverPreview();
    if (cp) URL.revokeObjectURL(cp.preview);
    this.coverPreview.set(null);
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

  articleThumb(a: Article): string {
    const img = a.cover ?? a.blocks?.[0]?.image ?? null;
    return img ? this.resolveImg(img) : '';
  }

  articlePreview(a: Article): string {
    return a.blocks?.[0]?.paragraph ?? '';
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('it-IT', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }
}
