import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { BdtPipe } from '../../../pipes/bdt.pipe';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { UserOrderDetails } from '../../shared/user-order-details/user-order-details';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { SOrder } from '../../../services/s-order';

@Component({
  selector: 'app-orders',
  imports: [CommonModule, BdtPipe, FontAwesomeModule, UserOrderDetails],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders {
  faEye = faEye;
  private orderService = inject(SOrder);
  // private auth = inject(Auth);

  userId: string | null = null;
  orders = signal<any[]>([]);
  selectedOrder = signal<any>(null);
  showModal = false;
  isLoading = false;
  error = '';

  // ngOnInit(): void {
  //   this.auth.onAuthStateChanged((user) => {
  //     this.userId = user?.uid ?? null;
  //     if (this.userId) {
  //       this.loadOrders();
  //     }
  //   });
  // }

  loadOrders(): void {
    this.isLoading = true;
    this.error = '';
    if (!this.userId) {
      this.error = 'User not authenticated';
      this.isLoading = false;
      return;
    }

    this.orderService.getByUser(this.userId).subscribe({
      next: (response: any) => {
        // Transform the response to handle $values and status
        const orders = (response.$values || []).map((order: any) => ({
          ...order,
          orderItems: order.OrderItems?.$values || [],
          orderStatus: this.getStatusText(order.OrderStatus),
          shippingAddress: order.ShippingAddress
        }));

        this.orders.set(orders);
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load orders. Please try again later.';
        this.isLoading = false;
        console.error('Error loading orders:', err);
        // this.toastService.showMessage('error', 'Error', 'Failed to load orders');
      }
    });
  }

  private getStatusText(statusCode: number): string {
    const statusMap: Record<number, string> = {
      0: 'Pending',
      1: 'Processing',
      2: 'Shipped',
      3: 'Delivered',
      4: 'Cancelled'
    };
    return statusMap[statusCode] || 'Unknown';
  }

  viewOrderDetails(order: any) {
    // Transform the order data to match what OrderDetailsComponent expects
    const transformedOrder = {
      id: order.Id,
      userId: order.UserId,
      userEmail: order.UserEmail,
      userName: order.UserName,
      userPhone: order.UserPhone,
      subtotal: order.Subtotal,
      deliveryCharge: order.DeliveryCharge,
      totalAmount: order.TotalAmount,
      paymentMethod: order.PaymentMethod,
      orderStatus: order.orderStatus, // Already transformed to text
      orderDate: order.OrderDate,
      deliveredDate: order.DeliveredDate,
      orderItems: order.orderItems, // Already transformed
      shippingAddress: {
        district: order.ShippingAddress?.District,
        city: order.ShippingAddress?.City,
        street: order.ShippingAddress?.Street,
        contact: order.ShippingAddress?.Contact,
        type: order.ShippingAddress?.Type
      }
    };

    this.selectedOrder.set(transformedOrder);
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedOrder.set(null);
  }

}
