import { Component, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../i18n/translate.pipe';

export interface NewsItem {
  img: string;
  categoryKey: string;
  categoryColor: string;
  dateKey: string;
  titleKey: string;
  descKey: string;
}

export interface EventItem {
  dayKey: string;
  monthKey: string;
  titleKey: string;
  locationKey: string;
  timeKey: string;
  accentClass: string;
  btnKey: string;
  route: string;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  parallaxOffset = 0;

  readonly news: NewsItem[] = [
    {
      img: '/img/hero.jpg',
      categoryKey: 'home.news_1_category',
      categoryColor: 'bg-secondary/10 text-secondary',
      dateKey: 'home.news_1_date',
      titleKey: 'home.news_1_title',
      descKey: 'home.news_1_desc',
    },
    {
      img: '/img/news2.jpg',
      categoryKey: 'home.news_2_category',
      categoryColor: 'bg-primary/10 text-primary',
      dateKey: 'home.news_2_date',
      titleKey: 'home.news_2_title',
      descKey: 'home.news_2_desc',
    },
    {
      img: '/img/news3.jpg',
      categoryKey: 'home.news_3_category',
      categoryColor: 'bg-[#0d6e6e]/10 text-[#0d6e6e]',
      dateKey: 'home.news_3_date',
      titleKey: 'home.news_3_title',
      descKey: 'home.news_3_desc',
    },
  ];

  readonly events: EventItem[] = [
    {
      dayKey: 'home.event_1_day',
      monthKey: 'home.event_1_month',
      titleKey: 'home.event_1_title',
      locationKey: 'home.event_1_location',
      timeKey: 'home.event_1_time',
      accentClass: 'border-secondary',
      btnKey: 'home.event_1_btn',
      route: '/events',
    },
    {
      dayKey: 'home.event_2_day',
      monthKey: 'home.event_2_month',
      titleKey: 'home.event_2_title',
      locationKey: 'home.event_2_location',
      timeKey: 'home.event_2_time',
      accentClass: 'border-[#f8bd2a]',
      btnKey: 'home.event_2_btn',
      route: '/events',
    },
  ];

  @HostListener('window:scroll')
  onScroll(): void {
    this.parallaxOffset = window.scrollY * 0.25;
  }
}
