import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { BdtPipe } from '../../../../pipes/bdt.pipe';
import { OrderM } from '../../../../models/OrderM';

@Component({
  selector: 'app-order-details',
  imports: [CommonModule, DatePipe, BdtPipe],
  templateUrl: './order-details.html',
  styleUrl: './order-details.css',
})
export class OrderDetails {
  @Input() order!: OrderM | null;

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Processing': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Shipped': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Delivered': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Cancelled': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }

}
