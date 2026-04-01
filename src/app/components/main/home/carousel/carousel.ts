import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, inject, input } from '@angular/core';
import { Router } from "@angular/router";
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-carousel',
  imports: [],
  templateUrl: './carousel.html',
  styleUrl: './carousel.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Carousel {
  private router = inject(Router);
  carousels = input<any[]>([]);
  imageApi = environment.ImageApi;

  navigate(url: string) {
    this.router.navigateByUrl(url);
  }
}
