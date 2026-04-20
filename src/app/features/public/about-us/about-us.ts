import { Component, HostListener, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../i18n/translate.pipe';

@Component({
  selector: 'app-about-us',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './about-us.html',
  styleUrl: './about-us.css',
})
export class AboutUs {
  parallaxOffset = 0;
  boardOffset = signal(0);

  readonly pillars = [
    { icon: 'auto_awesome', titleKey: 'about-us.pillar_1_title', descKey: 'about-us.pillar_1_desc' },
    { icon: 'groups',       titleKey: 'about-us.pillar_2_title', descKey: 'about-us.pillar_2_desc' },
  ];

  readonly timeline = [
    { yearKey: 'about-us.timeline_1_year', titleKey: 'about-us.timeline_1_title', descKey: 'about-us.timeline_1_desc' },
    { yearKey: 'about-us.timeline_2_year', titleKey: 'about-us.timeline_2_title', descKey: 'about-us.timeline_2_desc' },
    { yearKey: 'about-us.timeline_3_year', titleKey: 'about-us.timeline_3_title', descKey: 'about-us.timeline_3_desc' },
  ];

  readonly values = [
    { icon: 'verified',   titleKey: 'about-us.value_1_title', descKey: 'about-us.value_1_desc' },
    { icon: 'handshake',  titleKey: 'about-us.value_2_title', descKey: 'about-us.value_2_desc' },
    { icon: 'lightbulb',  titleKey: 'about-us.value_3_title', descKey: 'about-us.value_3_desc' },
  ];

  readonly members = [
    { img: '/img/member1.jpg', nameKey: 'about-us.member_1_name', roleKey: 'about-us.member_1_role', descKey: 'about-us.member_1_desc' },
    { img: '/img/member2.jpg', nameKey: 'about-us.member_2_name', roleKey: 'about-us.member_2_role', descKey: 'about-us.member_2_desc' },
    { img: '/img/member3.jpg', nameKey: 'about-us.member_3_name', roleKey: 'about-us.member_3_role', descKey: 'about-us.member_3_desc' },
    { img: '/img/member4.jpg', nameKey: 'about-us.member_4_name', roleKey: 'about-us.member_4_role', descKey: 'about-us.member_4_desc' },
  ];

  prevBoard(): void {
    this.boardOffset.update(v => Math.max(0, v - 1));
  }

  nextBoard(): void {
    this.boardOffset.update(v => Math.min(this.members.length - 1, v + 1));
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.parallaxOffset = window.scrollY * 0.25;
  }
}
