import { Component, ElementRef, inject, signal, AfterViewInit, OnDestroy } from '@angular/core';
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

  // Stats
  stats = [
    { value: '10K+', label: 'Happy Customers', icon: 'fas fa-users' },
    { value: '5K+', label: 'Products Delivered', icon: 'fas fa-box-open' },
    { value: '50+', label: 'Brands Available', icon: 'fas fa-tags' },
    { value: '24/7', label: 'Customer Support', icon: 'fas fa-headset' },
  ];

  // Values
  values = [
    { title: 'Quality First', desc: 'We source only the best products ensuring top quality for every purchase.', icon: 'fas fa-gem' },
    { title: 'Fast Delivery', desc: 'Quick and reliable delivery to your doorstep across Bangladesh.', icon: 'fas fa-shipping-fast' },
    { title: 'Secure Payment', desc: 'Multiple secure payment options for your convenience.', icon: 'fas fa-shield-alt' },
    { title: 'Easy Returns', desc: 'Hassle-free return and exchange policy for your peace of mind.', icon: 'fas fa-undo-alt' },
  ];

  ngOnInit() {
    this.aboutService.get(this.siteId).subscribe({
      next: (data) => {
        this.aboutData.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    setTimeout(() => this.ready.set(true), 100);
  }

  ngAfterViewInit() {
    this.observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('in-view');
      }),
      { threshold: 0.15 }
    );
    this.el.nativeElement.querySelectorAll('.animate-on-scroll').forEach((el: Element) =>
      this.observer!.observe(el)
    );
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }
}
