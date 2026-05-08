import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Project, CreateProjectDto, ProjectCategory, ProjectStatus } from '../../../core/models/project.model';
import { ProjectsService } from '../../../core/services/projects/projects';
import { Toolbar } from '../../../shared/components/private/toolbar/toolbar';
import { environment } from '../../../../environments/environment';

interface ImagePreview {
  file:      File;
  preview:   string;
  uploading: boolean;
  url:       string | null;
  error:     boolean;
}

const CATEGORIES: ProjectCategory[] = ['cultura', 'tradizione', 'sociale', 'educazione'];

@Component({
  selector: 'app-projects',
  imports: [FormsModule, Toolbar],
  templateUrl: './projects.html',
  styleUrl: './projects.css',
})
export class Projects implements OnInit {
  private projectsService = inject(ProjectsService);

  projects      = signal<Project[]>([]);
  loading       = signal(true);
  saving        = signal(false);

  showModal     = signal(false);
  detailProject = signal<Project | null>(null);

  checkedIds    = signal<Set<string>>(new Set());
  readonly checkedCount = computed(() => this.checkedIds().size);

  imagePreviews = signal<ImagePreview[]>([]);
  coverPreview  = signal<ImagePreview | null>(null);

  readonly allUploaded = computed(() =>
    this.imagePreviews().every(p => p.url !== null || p.error) &&
    (this.coverPreview() === null || this.coverPreview()!.url !== null || this.coverPreview()!.error),
  );

  readonly categories = CATEGORIES;
  form: CreateProjectDto = { title: '', description: '', category: 'cultura', status: 'ongoing', images: [], cover: undefined };

  ngOnInit(): void {
    this.projectsService.getAll().subscribe({
      next: list => { this.projects.set(list); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
  }

  openCreate(): void {
    this.form = { title: '', description: '', category: 'cultura', status: 'ongoing', images: [], cover: undefined };
    this.clearPreviews();
    this.showModal.set(true);
  }

  closeCreate(): void { this.showModal.set(false); this.clearPreviews(); }

  openDetail(p: Project): void { this.detailProject.set(p); }
  closeDetail(): void          { this.detailProject.set(null); }

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
    this.projectsService.uploadImages([file]).subscribe({
      next: ({ urls }) => {
        this.coverPreview.update(cp => cp ? { ...cp, uploading: false, url: urls[0] ?? null } : cp);
        this.syncFormImages();
      },
      error: () => this.coverPreview.update(cp => cp ? { ...cp, uploading: false, error: true } : cp),
    });
  }

  removeCover(): void {
    const cp = this.coverPreview();
    if (cp) URL.revokeObjectURL(cp.preview);
    this.coverPreview.set(null);
    this.form.cover = undefined;
  }

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
    const MAX_SIZE = 15 * 1024 * 1024;
    files = files.filter(f => {
      if (f.size > MAX_SIZE) { alert(`"${f.name}" supera il limite di 5 MB.`); return false; }
      return true;
    });
    if (!files.length) return;

    const newPreviews: ImagePreview[] = files.map(file => ({
      file, preview: URL.createObjectURL(file), uploading: true, url: null, error: false,
    }));
    this.imagePreviews.update(list => [...list, ...newPreviews]);

    this.projectsService.uploadImages(files).subscribe({
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
    this.form.cover  = this.coverPreview()?.url ?? undefined;
  }

  private clearPreviews(): void {
    this.imagePreviews().forEach(p => URL.revokeObjectURL(p.preview));
    this.imagePreviews.set([]);
    const cp = this.coverPreview();
    if (cp) URL.revokeObjectURL(cp.preview);
    this.coverPreview.set(null);
  }

  // ── Submit / Delete ───────────────────────────────────────────────────

  submit(): void {
    if (!this.form.title || !this.form.description) return;
    this.syncFormImages();
    this.saving.set(true);
    this.projectsService.create(this.form).subscribe({
      next: project => {
        this.projects.update(list => [project, ...list]);
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
    this.projectsService.deleteMany(ids).subscribe({
      next: () => {
        this.projects.update(list => list.filter(p => !ids.includes(p.id)));
        if (ids.includes(this.detailProject()?.id ?? '')) this.closeDetail();
        this.checkedIds.set(new Set());
      },
    });
  }

  resolveImg(path: string): string {
    if (path.startsWith('http')) return path;
    return `${environment.apiUrl}${path}`;
  }

  categoryLabel(cat: ProjectCategory): string {
    const map: Record<ProjectCategory, string> = {
      cultura: 'Cultura', tradizione: 'Tradizione', sociale: 'Sociale', educazione: 'Educazione',
    };
    return map[cat];
  }

  categoryColor(cat: ProjectCategory): string {
    const map: Record<ProjectCategory, string> = {
      cultura:    'bg-primary/8 text-primary',
      tradizione: 'bg-secondary/10 text-secondary',
      sociale:    'bg-[#0d6e6e]/10 text-[#0d6e6e]',
      educazione: 'bg-[#6750a4]/10 text-[#6750a4]',
    };
    return map[cat];
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('it-IT', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }
}
