import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'dashboard-theme';

  isDarkMode = signal<boolean>(this.getInitialTheme());

  constructor() {
    effect(() => {
      this.applyTheme(this.isDarkMode());
    });
  }

  private getInitialTheme(): boolean {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored !== null) {
      return stored === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private applyTheme(isDark: boolean): void {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    localStorage.setItem(this.STORAGE_KEY, isDark ? 'dark' : 'light');
  }

  toggleTheme(): void {
    this.isDarkMode.update(current => !current);
  }

  setTheme(isDark: boolean): void {
    this.isDarkMode.set(isDark);
  }
}
