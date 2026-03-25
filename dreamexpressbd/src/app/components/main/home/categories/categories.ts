import { NgOptimizedImage } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-categories',
  imports: [RouterLink, NgOptimizedImage],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class Categories {
    categories = input<any[]>([]);

  breakpoints = {
    480: { slidesPerView: 2, spaceBetween: 5 },
    // 768: { slidesPerView: 3, spaceBetween: 10 },
    1024: { slidesPerView: 3, spaceBetween: 20 },
    1440: { slidesPerView: 4, spaceBetween: 25 }
  }

}
