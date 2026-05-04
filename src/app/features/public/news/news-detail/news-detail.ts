import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Article } from '../../../../core/models/article.model';
import { ArticlesService } from '../../../../core/services/articles/articles';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-news-detail',
  imports: [RouterLink],
  templateUrl: './news-detail.html',
})
export class NewsDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private svc   = inject(ArticlesService);

  article  = signal<Article | null>(null);
  loading  = signal(true);
  notFound = signal(false);
  lightbox = signal<string | null>(null);

  readonly apiBase = environment.apiUrl;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.svc.getById(id).subscribe({
      next: a  => { this.article.set(a); this.loading.set(false); },
      error: () => { this.notFound.set(true); this.loading.set(false); },
    });
  }

  resolveImg(path: string): string {
    if (path.startsWith('http')) return path;
    return `${this.apiBase}${path}`;
  }

  openLightbox(url: string): void { this.lightbox.set(url); }
  closeLightbox(): void           { this.lightbox.set(null); }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('it-IT', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  }
}
