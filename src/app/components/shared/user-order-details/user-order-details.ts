import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { BdtPipe } from '../../../pipes/bdt.pipe';

@Component({
  selector: 'app-user-order-details',
  imports: [CommonModule, DatePipe, BdtPipe],
  templateUrl: './user-order-details.html',
  styleUrl: './user-order-details.css',
})
export class UserOrderDetails {
  @Input() order: any;

}
