import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, inject, input, OnInit, signal } from '@angular/core';
import { Router } from "@angular/router";
import { environment } from '../../../../../environments/environment';

let swiperRegistered = false;

@Component({
  selector: 'app-carousel',
  imports: [],
  templateUrl: './carousel.html',
  styleUrl: './carousel.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Carousel implements OnInit {
  private router = inject(Router);
  carousels = input<any[]>([]);
  imageApi = environment.ImageApi;
  swiperReady = signal(false);

  ngOnInit() {
    // Defer Swiper loading — let the static first image paint as LCP first
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => this.loadSwiper());
    } else {
      setTimeout(() => this.loadSwiper(), 200);
    }
  }

  private async loadSwiper() {
    if (!swiperRegistered) {
      const { register } = await import('swiper/element/bundle');
      register();
      swiperRegistered = true;
    }
    this.swiperReady.set(true);
  }

  navigate(url: string) {
    this.router.navigateByUrl(url);
  }
}
