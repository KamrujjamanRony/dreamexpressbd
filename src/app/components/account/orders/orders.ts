import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BdtPipe } from '../../../pipes/bdt.pipe';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import { SOrder } from '../../../services/s-order';
import { SAuthCookie } from '../../../services/s-auth-cookie';
import { Router } from '@angular/router';

@Component({
  selector: 'app-orders',
  imports: [CommonModule, FontAwesomeModule, BdtPipe],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders {
  faEye = faEye;
  faBoxOpen = faBoxOpen;

  private orderService = inject(SOrder);
  private authCookie = inject(SAuthCookie);
  private router = inject(Router);

  orders = signal<any[]>([]);
  loading = signal(false);
  error = signal('');

  get user() {
    return this.authCookie.getUserData();
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    const user = this.authCookie.getUserData();
    if (!user?.phone) {
      this.error.set('Please login to view your orders');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.orderService.search('', '', '', user.id).subscribe({
      next: (response: any) => {
        const allOrders = response?.$values || response || [];
        // Filter orders by the logged-in user's phone
        const userOrders = allOrders.filter(
          (o: any) => o.userPhone === user.phone || o.UserPhone === user.phone
        );
        this.orders.set(userOrders);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error?.error || 'Failed to load orders. Please try again later.');
        this.loading.set(false);
      },
    });
  }

  getStatusClass(status: string | number): string {
    const statusMap: Record<string, string> = {
      'Pending': 'bg-amber-100 text-amber-700',
      'Processing': 'bg-blue-100 text-blue-700',
      'Shipped': 'bg-indigo-100 text-indigo-700',
      'Delivered': 'bg-green-100 text-green-700',
      'Cancelled': 'bg-red-100 text-red-700',
      '0': 'bg-amber-100 text-amber-700',
      '1': 'bg-blue-100 text-blue-700',
      '2': 'bg-indigo-100 text-indigo-700',
      '3': 'bg-green-100 text-green-700',
      '4': 'bg-red-100 text-red-700',
    };
    return statusMap[String(status)] || 'bg-gray-100 text-gray-700';
  }

  getStatusText(status: string | number): string {
    const statusMap: Record<string, string> = {
      '0': 'Pending',
      '1': 'Processing',
      '2': 'Shipped',
      '3': 'Delivered',
      '4': 'Cancelled',
    };
    return statusMap[String(status)] || String(status);
  }

  trackOrder(order: any): void {
    this.router.navigate(['/account/order-tracking'], {
      queryParams: { orderId: order.id || order.Id },
    });
  }
}
