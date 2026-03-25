import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class STheme {
  private renderer: Renderer2;
  private darkMode = new BehaviorSubject<boolean>(false);
  darkMode$ = this.darkMode.asObservable();

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.initializeTheme();
  }

  private initializeTheme() {
    // Check localStorage first
    const storedTheme = localStorage.getItem('color-theme');
    
    if (storedTheme === 'dark') {
      this.applyDarkMode();
    } else if (storedTheme === 'light') {
      this.applyLightMode();
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        this.applyDarkMode();
      } else {
        this.applyLightMode();
      }
    }

    // Listen for system theme changes
    this.watchSystemTheme();
  }

  private applyDarkMode() {
    this.renderer.addClass(document.documentElement, 'dark');
    localStorage.setItem('color-theme', 'dark');
    this.darkMode.next(true);
  }

  private applyLightMode() {
    this.renderer.removeClass(document.documentElement, 'dark');
    localStorage.setItem('color-theme', 'light');
    this.darkMode.next(false);
  }

  private watchSystemTheme() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      // Only change if user hasn't set a manual preference
      if (!localStorage.getItem('color-theme')) {
        if (e.matches) {
          this.applyDarkMode();
        } else {
          this.applyLightMode();
        }
      }
    });
  }

  toggleTheme() {
    if (this.darkMode.value) {
      this.applyLightMode();
    } else {
      this.applyDarkMode();
    }
  }

  isDarkMode(): boolean {
    return this.darkMode.value;
  }
  
}
