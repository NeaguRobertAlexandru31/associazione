import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../i18n/translate.pipe';

export interface Project {
  img: string;
  category: 'cultura' | 'tradizione' | 'sociale' | 'educazione';
  categoryKey: string;
  status: 'ongoing' | 'completed';
  titleKey: string;
  descKey: string;
}

export interface Filter {
  value: string;
  labelKey: string;
}

@Component({
  selector: 'app-projects',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './projects.html',
  styleUrl: './projects.css',
})
export class Projects {
  readonly filters: Filter[] = [
    { value: 'all',        labelKey: 'projects.filter_all'        },
    { value: 'cultura',    labelKey: 'projects.filter_cultura'    },
    { value: 'tradizione', labelKey: 'projects.filter_tradizione' },
    { value: 'sociale',    labelKey: 'projects.filter_sociale'    },
    { value: 'educazione', labelKey: 'projects.filter_educazione' },
  ];

  readonly allProjects: Project[] = [
    { img: '/img/hero.jpg',        category: 'cultura',    categoryKey: 'projects.filter_cultura',    status: 'ongoing',   titleKey: 'projects.p1_title', descKey: 'projects.p1_desc' },
    { img: '/img/about-hero.jpg',  category: 'tradizione', categoryKey: 'projects.filter_tradizione', status: 'completed', titleKey: 'projects.p2_title', descKey: 'projects.p2_desc' },
    { img: '/img/member1.jpg',     category: 'educazione', categoryKey: 'projects.filter_educazione', status: 'ongoing',   titleKey: 'projects.p3_title', descKey: 'projects.p3_desc' },
    { img: '/img/member3.jpg',     category: 'sociale',    categoryKey: 'projects.filter_sociale',    status: 'ongoing',   titleKey: 'projects.p4_title', descKey: 'projects.p4_desc' },
    { img: '/img/member2.jpg',     category: 'cultura',    categoryKey: 'projects.filter_cultura',    status: 'completed', titleKey: 'projects.p5_title', descKey: 'projects.p5_desc' },
    { img: '/img/member4.jpg',     category: 'tradizione', categoryKey: 'projects.filter_tradizione', status: 'ongoing',   titleKey: 'projects.p6_title', descKey: 'projects.p6_desc' },
  ];

  activeFilter = signal('all');

  filteredProjects = computed(() =>
    this.activeFilter() === 'all'
      ? this.allProjects
      : this.allProjects.filter(p => p.category === this.activeFilter())
  );

  setFilter(value: string): void {
    this.activeFilter.set(value);
  }
}
