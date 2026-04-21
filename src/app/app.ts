import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Navbar } from './shared/components/public/navbar/navbar';
import { Footer } from './shared/components/public/footer/footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private router = inject(Router);
  private url = signal(this.router.url);

  readonly showShell = computed(() =>
    !this.url().startsWith('/login') && !this.url().startsWith('/dashboard')
  );

  constructor() {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(e => this.url.set((e as NavigationEnd).urlAfterRedirects));
  }
}
