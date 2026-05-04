import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../i18n/translate.pipe';
import { SiteSettingsService } from '../../../core/services/site-settings/site-settings';

@Component({
  selector: 'app-about-us',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './about-us.html',
  styleUrl: './about-us.css',
})
export class AboutUs implements OnInit {
  readonly siteSettings = inject(SiteSettingsService);
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

  readonly members = computed(() => [
    { img: this.siteSettings.img('img_about_member_1'), nameKey: 'about-us.member_1_name', roleKey: 'about-us.member_1_role', descKey: 'about-us.member_1_desc' },
    { img: this.siteSettings.img('img_about_member_2'), nameKey: 'about-us.member_2_name', roleKey: 'about-us.member_2_role', descKey: 'about-us.member_2_desc' },
    { img: this.siteSettings.img('img_about_member_3'), nameKey: 'about-us.member_3_name', roleKey: 'about-us.member_3_role', descKey: 'about-us.member_3_desc' },
    { img: this.siteSettings.img('img_about_member_4'), nameKey: 'about-us.member_4_name', roleKey: 'about-us.member_4_role', descKey: 'about-us.member_4_desc' },
  ]);

  ngOnInit(): void { this.siteSettings.load(); }

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
