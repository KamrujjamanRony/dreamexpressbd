import { Component, input } from '@angular/core';
import { Product } from '../../../../models/Products';
import { ProductCard } from '../../../shared/product-card/product-card';

@Component({
  selector: 'app-product-wrapper',
  imports: [ProductCard],
  templateUrl: './product-wrapper.html',
  styleUrl: './product-wrapper.css',
})
export class ProductWrapper {
  products = input<Product[]>([]);

}
