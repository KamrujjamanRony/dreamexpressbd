import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-product-skeleton',
  imports: [],
  templateUrl: './product-skeleton.html',
  styleUrl: './product-skeleton.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductSkeleton {

}
