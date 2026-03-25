import { Component } from '@angular/core';
import { BdtPipe } from '../../../../pipes/bdt.pipe';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-feature-product',
  imports: [BdtPipe, NgOptimizedImage],
  templateUrl: './feature-product.html',
  styleUrl: './feature-product.css',
})
export class FeatureProduct {

}
