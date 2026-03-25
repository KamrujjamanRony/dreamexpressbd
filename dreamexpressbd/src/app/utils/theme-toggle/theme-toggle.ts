import { AfterViewInit, Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { STheme } from './s-theme';

@Component({
  selector: 'app-theme-toggle',
  imports: [],
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.css',
})
export class ThemeToggle implements OnInit, AfterViewInit {
  private themeService = inject(STheme);
  isDarkMode = false;
  
  @ViewChild('themeCheckbox') themeCheckbox!: ElementRef;

  ngOnInit() {
    this.themeService.darkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
      this.updateCheckboxState();
    });
  }

  ngAfterViewInit() {
    this.updateCheckboxState();
  }

  themeModeToggle() {
    this.themeService.toggleTheme();
  }

  private updateCheckboxState() {
    if (this.themeCheckbox) {
      this.themeCheckbox.nativeElement.checked = this.isDarkMode;
    }
  }
}
