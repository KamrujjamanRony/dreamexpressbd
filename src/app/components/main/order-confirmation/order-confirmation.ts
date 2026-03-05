import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { BdtPipe } from '../../../pipes/bdt.pipe';
import { ActivatedRoute, Router } from '@angular/router';
import { SOrder } from '../../../services/s-order';

@Component({
  selector: 'app-order-confirmation',
  imports: [CommonModule, BdtPipe, NgOptimizedImage],
  templateUrl: './order-confirmation.html',
  styleUrl: './order-confirmation.css',
})
export class OrderConfirmation {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(SOrder);
  orderId: string | null = null;
  orderDetails: any = null;
  loading = true;

  ngOnInit() {
    // Get order ID from route state or URL
    this.orderId = history.state?.orderId || this.route.snapshot.paramMap.get('id');

    if (!this.orderId) {
      // this.toastService.showMessage('error', 'Error', 'No order ID provided');
      this.router.navigate(['/']);
      return;
    }

    this.loadOrderDetails();
  }

  loadOrderDetails() {
    this.orderService.getById(this.orderId!).subscribe({
      next: (order) => {
        this.orderDetails = order;
        this.loading = false;
      },
      error: (error) => {
        // this.toastService.showMessage('error', 'Error', 'Failed to load order details');
        console.error('Error loading order:', error);
        this.router.navigate(['/']);
      }
    });
  }

  getOrderStatusText(status: number): string {
    switch (status) {
      case 0: return 'Pending';
      case 1: return 'Processing';
      case 2: return 'Shipped';
      case 3: return 'Delivered';
      case 4: return 'Cancelled';
      default: return 'Unknown';
    }
  }

  continueShopping() {
    this.router.navigate(['/shop']);
  }

}
