import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Project } from '../../../../core/models/project.model';
import { ProjectsService } from '../../../../core/services/projects/projects';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-project-detail',
  imports: [RouterLink],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.css',
})
export class ProjectDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private svc   = inject(ProjectsService);

  project       = signal<Project | null>(null);
  loading       = signal(true);
  notFound      = signal(false);
  lightboxIndex = signal<number | null>(null);

  readonly apiBase = environment.apiUrl;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.svc.getById(id).subscribe({
      next: p  => { this.project.set(p); this.loading.set(false); },
      error: () => { this.notFound.set(true); this.loading.set(false); },
    });
  }

  resolveImg(path: string): string {
    return path.startsWith('http') ? path : `${this.apiBase}${path}`;
  }

  openLightbox(index: number): void { this.lightboxIndex.set(index); }
  closeLightbox(): void              { this.lightboxIndex.set(null); }

  prev(images: string[]): void {
    const cur = this.lightboxIndex();
    if (cur === null) return;
    this.lightboxIndex.set((cur - 1 + images.length) % images.length);
  }

  next(images: string[]): void {
    const cur = this.lightboxIndex();
    if (cur === null) return;
    this.lightboxIndex.set((cur + 1) % images.length);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('it-IT', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  categoryLabel(cat: string): string {
    const map: Record<string, string> = {
      cultura:    'Cultura',
      tradizione: 'Tradizione',
      sociale:    'Sociale',
      educazione: 'Educazione',
    };
    return map[cat] ?? cat;
  }

  categoryColor(cat: string): string {
    const map: Record<string, string> = {
      cultura:    'bg-primary text-on-primary',
      tradizione: 'bg-secondary text-on-primary',
      sociale:    'bg-[#0d6e6e] text-white',
      educazione: 'bg-[#6750a4] text-white',
    };
    return map[cat] ?? 'bg-surface-container text-on-surface-variant';
  }
}
