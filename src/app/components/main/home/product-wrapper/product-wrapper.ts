import { Component, input } from '@angular/core';
import { ProductCard } from '../../../shared/product-card/product-card';
import { ProductSkeleton } from "../../../shared/product-skeleton/product-skeleton";
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-wrapper',
  imports: [ProductCard, ProductSkeleton, RouterLink, CommonModule],
  templateUrl: './product-wrapper.html',
  styleUrl: './product-wrapper.css',
})
export class ProductWrapper {
  categoryWiseProducts = input<any>(null);
  categories = input<any>(null);

}
