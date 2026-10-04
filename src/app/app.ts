import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { ViewportScroller } from '@angular/common';
import { filter } from 'rxjs/operators';
import { Navbar } from './shared/components/public/navbar/navbar';
import { Footer } from './shared/components/public/footer/footer';
import { Analytics } from './core/services/analytics/analytics';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {

  private router = inject(Router);
  private analytics = inject(Analytics);
  private url = signal(this.router.url);

  readonly showShell = computed(() =>
    !this.url().startsWith('/login') && !this.url().startsWith('/dashboard')
  );

  constructor() {
    inject(ViewportScroller).setOffset([0, 72]);
    this.analytics.init();

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(e => {
        const url = (e as NavigationEnd).urlAfterRedirects;
        this.url.set(url);
        this.analytics.page(url);
      });
  }
}
