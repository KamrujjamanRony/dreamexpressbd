import { Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { Product } from '../../../../models/Products';
import { ProductCard } from '../../../shared/product-card/product-card';

@Component({
  selector: 'app-recommend-product',
  imports: [ProductCard],
  templateUrl: './recommend-product.html',
  styleUrl: './recommend-product.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class RecommendProduct {
  products = input<Product[]>([]);

  breakpoints = {
    480: { slidesPerView: 2, spaceBetween: 5 },
    // 768: { slidesPerView: 3, spaceBetween: 10 },
    1024: { slidesPerView: 3, spaceBetween: 20 },
    1440: { slidesPerView: 4, spaceBetween: 25 }
  }

}
