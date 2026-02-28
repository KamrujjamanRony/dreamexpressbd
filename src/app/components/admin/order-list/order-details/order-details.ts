import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { BdtPipe } from '../../../../pipes/bdt.pipe';

@Component({
  selector: 'app-order-details',
  imports: [CommonModule, DatePipe, BdtPipe],
  templateUrl: './order-details.html',
  styleUrl: './order-details.css',
})
export class OrderDetails {
  @Input() order: any;

}
