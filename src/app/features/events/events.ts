import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-events',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './events.html',
  styleUrl: './events.css',
})
export class Events {
  readonly upcoming = [
    {
      dayKey: 'events.e1_day', monthKey: 'events.e1_month',
      titleKey: 'events.e1_title', descKey: 'events.e1_desc',
      locationKey: 'events.e1_location',
    },
    {
      dayKey: 'events.e2_day', monthKey: 'events.e2_month',
      titleKey: 'events.e2_title', descKey: 'events.e2_desc',
      locationKey: 'events.e2_location',
    },
  ];

  readonly archived = [
    { img: '/img/member3.jpg', dateKey: 'events.a1_date', titleKey: 'events.a1_title', descKey: 'events.a1_desc' },
    { img: '/img/member2.jpg', dateKey: 'events.a2_date', titleKey: 'events.a2_title', descKey: 'events.a2_desc' },
    { img: '/img/about-hero.jpg', dateKey: 'events.a3_date', titleKey: 'events.a3_title', descKey: 'events.a3_desc' },
  ];
}
