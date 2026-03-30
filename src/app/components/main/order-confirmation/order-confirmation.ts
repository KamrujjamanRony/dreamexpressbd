import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { BdtPipe } from '../../../pipes/bdt.pipe';
import { ActivatedRoute, Router } from '@angular/router';
import { SOrder } from '../../../services/s-order';
import { environment } from '../../../../environments/environment';
import QRCode from 'qrcode';

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
  ready = signal(false);
  companyName = environment.companyName;
  imgBaseUrl = environment.ImageApi;
  qrCodeUrl = signal<string>('');

  private checkoutState: any = null;

  ngOnInit() {
    this.checkoutState = history.state;
    this.orderId = this.checkoutState?.orderId || this.route.snapshot.paramMap.get('id');

    if (!this.orderId) {
      this.router.navigate(['/']);
      return;
    }

    this.loadOrderDetails();
  }

  loadOrderDetails() {
    this.orderService.get(this.orderId!).subscribe({
      next: (order: any) => {
        this.orderDetails = this.normalizeOrder(order);
        this.loading = false;
        this.generateQrCode();
        setTimeout(() => this.ready.set(true), 50);
      },
      error: (error: any) => {
        console.error('Error loading order:', error);
        this.router.navigate(['/']);
      }
    });
  }

  private generateQrCode() {
    const o = this.orderDetails;
    const items = this.getOrderItems()
      .map((i: any) => `${i.productName} x${i.quantity} @${i.price}`)
      .join('\n');
    const qrText = [
      `Order: #${this.orderId}`,
      `Date: ${new Date(o.orderDate).toLocaleDateString()}`,
      `Customer: ${o.userName}`,
      o.userPhone ? `Phone: ${o.userPhone}` : '',
      `---`,
      items,
      `---`,
      `Subtotal: ${o.subtotal}`,
      `Delivery: ${o.deliveryCharge}`,
      o.discountAmount > 0 ? `Discount: -${o.discountAmount}` : '',
      `Total: ${o.totalAmount}`,
      `Payment: ${o.paymentMethod}`,
    ].filter(Boolean).join('\n');

    QRCode.toDataURL(qrText, {
      width: 120,
      margin: 1,
      color: { dark: '#111827', light: '#ffffff' },
    }).then((url: string) => this.qrCodeUrl.set(url));
  }

  private normalizeOrder(o: any): any {
    const addr = o.shippingAddress ?? o.ShippingAddress;
    const rawItems = (o.orderItems ?? o.OrderItems);
    const items = rawItems?.$values || rawItems || [];
    const state = this.checkoutState;

    const subtotal = o.subtotal ?? o.Subtotal ?? 0;
    const deliveryCharge = o.deliveryCharge ?? o.DeliveryCharge ?? 0;
    const discountToken = o.discountToken ?? o.DiscountToken ?? state?.discountToken ?? '';
    const discountType = o.discountType ?? o.DiscountType ?? state?.discountType ?? '';
    const discountValue = o.discountValue ?? o.DiscountValue ?? state?.discountValue ?? 0;
    let discountAmount = o.discountAmount ?? o.DiscountAmount ?? state?.discountAmount ?? 0;

    // Recalculate discountAmount when backend returns 0 but discount token exists
    if (!discountAmount && discountToken && discountValue > 0) {
      if (discountType === 'Percentage') {
        discountAmount = Math.round((subtotal * discountValue) / 100 * 100) / 100;
      } else if (discountType === 'Fixed') {
        discountAmount = discountValue;
      } else if (discountType === 'FreeDelivery') {
        discountAmount = deliveryCharge;
      }
    }

    let totalAmount = o.totalAmount ?? o.TotalAmount ?? 0;

    // Recalculate total if discount exists but total doesn't reflect it
    if (discountAmount > 0 && totalAmount >= subtotal + deliveryCharge) {
      totalAmount = Math.max(0, subtotal + deliveryCharge - discountAmount);
    }

    return {
      id: o.id ?? o.Id,
      userName: o.userName ?? o.UserName ?? '',
      userPhone: o.userPhone ?? o.UserPhone ?? '',
      userEmail: o.userEmail ?? o.UserEmail ?? '',
      subtotal,
      deliveryCharge,
      totalAmount,
      paymentMethod: o.paymentMethod ?? o.PaymentMethod ?? '',
      orderStatus: o.orderStatus ?? o.OrderStatus ?? '',
      orderDate: o.orderDate ?? o.OrderDate ?? '',
      deliveredDate: o.deliveredDate ?? o.DeliveredDate ?? '',
      discountToken,
      discountType,
      discountValue,
      discountAmount,
      shippingAddress: {
        street: addr?.street ?? addr?.Street ?? '',
        city: addr?.city ?? addr?.City ?? '',
        district: addr?.district ?? addr?.District ?? '',
        contact: addr?.contact ?? addr?.Contact ?? '',
        type: addr?.type ?? addr?.Type ?? '',
      },
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

  getOrderStatusText(status: any): string {
    const statusMap: Record<string, string> = {
      '0': 'Pending', 'Pending': 'Pending',
      '1': 'Confirm', 'Confirm': 'Confirm',
      '2': 'Processing', 'Processing': 'Processing',
      '3': 'Shipped', 'Shipped': 'Shipped',
      '4': 'Delivered', 'Delivered': 'Delivered',
      '5': 'Cancelled', 'Cancelled': 'Cancelled',
    };
    return statusMap[String(status)] || String(status);
  }

  getStatusClass(status: any): string {
    const text = this.getOrderStatusText(status);
    switch (text) {
      case 'Pending': return 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400';
      case 'Confirm': return 'bg-teal-100 text-teal-800 dark:bg-teal-500/15 dark:text-teal-400';
      case 'Processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400';
      case 'Shipped': return 'bg-primary-100 text-primary-800 dark:bg-primary-500/15 dark:text-primary-400';
      case 'Delivered': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400';
      case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400';
      default: return 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400';
    }
  }

  getOrderItems(): any[] {
    return this.orderDetails?.orderItems || [];
  }

  getTotalQuantity(): number {
    return this.getOrderItems().reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
  }

  printVoucher() {
    document.body.classList.add('printing-voucher');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('printing-voucher');
    }, 100);
  }

  continueShopping() {
    this.router.navigate(['/shop']);
  }
}
