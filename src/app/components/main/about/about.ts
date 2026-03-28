import { Component, computed, ElementRef, inject, signal, AfterViewInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SAbout } from '../../../services/s-about';
import { AboutUsM } from '../../../models/AboutUs';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-about',
  imports: [RouterLink],
  templateUrl: './about.html',
  styleUrl: './about.css',
})
export class About implements AfterViewInit, OnDestroy {
  private aboutService = inject(SAbout);
  private el = inject(ElementRef);
  private observer?: IntersectionObserver;

  siteId = environment.companyCode;
  companyName = environment.companyName;
  imgBase = environment.ImageApi;
  aboutData = signal<AboutUsM | null>(null);
  loading = signal(true);
  ready = signal(false);

  private statIcons = ['fas fa-users', 'fas fa-box-open', 'fas fa-tags', 'fas fa-headset'];

  // Stats from API (title5-8 = labels, description5-8 = values)
  stats = computed(() => {
    const d = this.aboutData();
    if (!d) return [];
    return [
      { value: d.description5 || '', label: d.title5 || '', icon: this.statIcons[0] },
      { value: d.description6 || '', label: d.title6 || '', icon: this.statIcons[1] },
      { value: d.description7 || '', label: d.title7 || '', icon: this.statIcons[2] },
      { value: d.description8 || '', label: d.title8 || '', icon: this.statIcons[3] },
    ].filter(s => s.label || s.value);
  });

  // Split description2 (Mission & Vision) into lines
  missionVisionLines = computed(() => this.splitLines(this.aboutData()?.description2));

  // Split description4 (Core Values) into lines
  coreValueLines = computed(() => this.splitLines(this.aboutData()?.description4));

  private valueIcons = ['fas fa-handshake', 'fas fa-gem', 'fas fa-heart', 'fas fa-shield-alt', 'fas fa-lightbulb', 'fas fa-star', 'fas fa-rocket', 'fas fa-check-circle'];

  // Parse "Key: Description" lines from description4 into structured cards
  coreValues = computed(() => {
    const lines = this.coreValueLines();
    return lines.map((line, i) => {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        return { title: line.substring(0, colonIdx).trim(), desc: line.substring(colonIdx + 1).trim(), icon: this.valueIcons[i % this.valueIcons.length] };
      }
      return { title: line, desc: '', icon: this.valueIcons[i % this.valueIcons.length] };
    });
  });

  ngOnInit() {
    this.aboutService.get(this.siteId).subscribe({
      next: (data) => {
        this.aboutData.set(data);
        this.loading.set(false);
        // Re-observe new elements after template re-renders
        setTimeout(() => this.observeElements(), 100);
      },
      error: () => this.loading.set(false),
    });
    setTimeout(() => this.ready.set(true), 100);
  }

  ngAfterViewInit() {
    this.setupObserver();
    this.observeElements();
  }

  private setupObserver() {
    this.observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('in-view');
      }),
      { threshold: 0.15 }
    );
  }

  private observeElements() {
    this.el.nativeElement.querySelectorAll('.animate-on-scroll:not(.in-view)').forEach((el: Element) =>
      this.observer?.observe(el)
    );
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }

  private splitLines(text?: string): string[] {
    if (!text) return [];
    return text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  }
}
