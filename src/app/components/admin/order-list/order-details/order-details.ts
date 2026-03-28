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
  @Input() set order(value: OrderM | null) {
    this._order = value ? this.normalizeOrder(value) : null;
  }
  get order(): OrderM | null {
    return this._order;
  }
  private _order: OrderM | null = null;

  private normalizeOrder(o: any): any {
    let discountAmount = o.discountAmount || 0;
    const discountToken = o.discountToken || '';
    const discountType = o.discountType || '';
    const discountValue = o.discountValue || 0;
    const subtotal = o.subtotal || 0;
    const deliveryCharge = o.deliveryCharge || 0;

    if (!discountAmount && discountToken && discountValue > 0) {
      if (discountType === 'Percentage') {
        discountAmount = Math.round((subtotal * discountValue) / 100 * 100) / 100;
      } else if (discountType === 'Fixed') {
        discountAmount = Math.min(discountValue, subtotal);
      } else if (discountType === 'FreeDelivery') {
        discountAmount = deliveryCharge;
      }
    }

    let totalAmount = o.totalAmount || 0;
    if (discountAmount > 0 && totalAmount >= subtotal + deliveryCharge) {
      totalAmount = Math.max(0, subtotal + deliveryCharge - discountAmount);
    }

    return { ...o, discountAmount, totalAmount };
  }

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
