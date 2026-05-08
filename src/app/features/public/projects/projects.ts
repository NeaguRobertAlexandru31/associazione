import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../i18n/translate.pipe';
import { SiteSettingsService } from '../../../core/services/site-settings/site-settings';
import { Project } from '../../../core/models/project.model';
import { ProjectsService } from '../../../core/services/projects/projects';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-projects',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './projects.html',
  styleUrl: './projects.css',
})
export class Projects implements OnInit {
  private projectsService = inject(ProjectsService);
  private router          = inject(Router);
  readonly siteSettings   = inject(SiteSettingsService);

  allProjects  = signal<Project[]>([]);
  loading      = signal(true);
  activeFilter = signal('all');

  readonly filters = [
    { value: 'all',        label: 'projects.filter_all'        },
    { value: 'cultura',    label: 'projects.filter_cultura'    },
    { value: 'tradizione', label: 'projects.filter_tradizione' },
    { value: 'sociale',    label: 'projects.filter_sociale'    },
    { value: 'educazione', label: 'projects.filter_educazione' },
  ];

  readonly filteredProjects = computed(() => {
    const f = this.activeFilter();
    if (f === 'all') return this.allProjects();
    return this.allProjects().filter(p => p.category === f);
  });

  ngOnInit(): void {
    this.siteSettings.load();
    this.projectsService.getAll().subscribe({
      next: list => { this.allProjects.set(list); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
  }

  setFilter(value: string): void { this.activeFilter.set(value); }

  goToDetail(p: Project): void { this.router.navigate(['/projects', p.id]); }

  coverImage(p: Project): string {
    const img = p.cover ?? p.images[0];
    if (!img) return this.siteSettings.placeholder('placeholder_page_hero');
    return img.startsWith('http') ? img : `${environment.apiUrl}${img}`;
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
