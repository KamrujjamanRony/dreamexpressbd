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
    const subtotal = o.subtotal ?? o.Subtotal ?? 0;
    const deliveryCharge = o.deliveryCharge ?? o.DeliveryCharge ?? 0;
    const discountToken = o.discountToken ?? o.DiscountToken ?? '';
    const discountType = o.discountType ?? o.DiscountType ?? '';
    const discountValue = o.discountValue ?? o.DiscountValue ?? 0;
    let discountAmount = o.discountAmount ?? o.DiscountAmount ?? 0;

    if (!discountAmount && discountToken && discountValue > 0) {
      if (discountType === 'Percentage') {
        discountAmount = Math.round((subtotal * discountValue) / 100 * 100) / 100;
      } else if (discountType === 'Fixed') {
        discountAmount = Math.min(discountValue, subtotal);
      } else if (discountType === 'FreeDelivery') {
        discountAmount = deliveryCharge;
      }
    }

    let totalAmount = o.totalAmount ?? o.TotalAmount ?? 0;
    if (discountAmount > 0 && totalAmount >= subtotal + deliveryCharge) {
      totalAmount = Math.max(0, subtotal + deliveryCharge - discountAmount);
    }

    const addr = o.shippingAddress ?? o.ShippingAddress;
    const rawItems = o.orderItems ?? o.OrderItems;
    const items = rawItems?.$values || rawItems || [];

    return {
      ...o,
      subtotal,
      deliveryCharge,
      totalAmount,
      discountToken,
      discountType,
      discountValue,
      discountAmount,
      userName: o.userName ?? o.UserName ?? '',
      userEmail: o.userEmail ?? o.UserEmail ?? '',
      userPhone: o.userPhone ?? o.UserPhone ?? '',
      paymentMethod: o.paymentMethod ?? o.PaymentMethod ?? '',
      orderStatus: o.orderStatus ?? o.OrderStatus ?? '',
      orderDate: o.orderDate ?? o.OrderDate ?? '',
      shippingAddress: addr ? {
        district: addr.district ?? addr.District ?? '',
        city: addr.city ?? addr.City ?? '',
        street: addr.street ?? addr.Street ?? '',
        contact: addr.contact ?? addr.Contact ?? '',
        type: addr.type ?? addr.Type ?? '',
      } : undefined,
      orderItems: items.map((item: any) => ({
        productId: item.productId ?? item.ProductId,
        productName: item.productName ?? item.ProductName ?? '',
        quantity: item.quantity ?? item.Quantity ?? 1,
        price: item.price ?? item.Price ?? 0,
        size: item.size ?? item.Size ?? '',
        color: item.color ?? item.Color ?? '',
        image: item.image ?? item.Image ?? '',
      })),
    };
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
