import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { BdtPipe } from '../../../pipes/bdt.pipe';
import { ActivatedRoute, Router } from '@angular/router';
import { SOrder } from '../../../services/s-order';
import { environment } from '../../../../environments/environment';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  downloadVoucherPdf() {
    if (!this.orderDetails || !this.orderId) {
      return;
    }

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const left = 40;
    const right = doc.internal.pageSize.getWidth() - 40;
    const maxTextWidth = right - left;
    const websiteUrl = 'https://chinatradexntour.com.bd/';
    const orderItems = this.getOrderItems();
    const order = this.orderDetails;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(this.companyName, left, 50);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text('Order Invoice', left, 68);
    doc.setFontSize(9.5);
    doc.text(websiteUrl, left, 82);

    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Invoice: #${this.orderId}`, right, 50, { align: 'right' });
    doc.text(`Date: ${new Date(order.orderDate).toLocaleDateString()}`, right, 66, { align: 'right' });
    doc.text(`Status: ${this.getOrderStatusText(order.orderStatus)}`, right, 82, { align: 'right' });

    let y = 112;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To', left, y);
    doc.text('Ship To', left + 185, y);
    doc.text('Payment', left + 370, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    const billTo = [
      order.userName || 'Customer',
      order.userPhone || '',
      order.userEmail || '',
    ].filter(Boolean).join('\n');
    const shipTo = [
      order.shippingAddress?.street || '',
      [order.shippingAddress?.city || '', order.shippingAddress?.district || ''].filter(Boolean).join(', '),
      order.shippingAddress?.contact ? `Phone: ${order.shippingAddress.contact}` : '',
    ].filter(Boolean).join('\n');

    doc.text(doc.splitTextToSize(billTo, 165), left, y + 14);
    doc.text(doc.splitTextToSize(shipTo, 165), left + 185, y + 14);
    doc.text(doc.splitTextToSize(order.paymentMethod || '', 165), left + 370, y + 14);

    y = 180;

    autoTable(doc, {
      startY: y,
      margin: { left, right: 40 },
      head: [['No', 'Item', 'Qty', 'Price', 'Total']],
      body: orderItems.map((item: any, index: number) => {
        const variant = [item.size, item.color].filter(Boolean).join(' / ');
        const itemLabel = variant ? `${item.productName} (${variant})` : item.productName;
        return [
          String(index + 1),
          itemLabel,
          String(item.quantity || 0),
          this.formatAmount(item.price || 0),
          this.formatAmount((item.price || 0) * (item.quantity || 0)),
        ];
      }),
      styles: { fontSize: 9, cellPadding: 6 },
      headStyles: { fillColor: [245, 245, 245], textColor: [45, 45, 45] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 35 },
        2: { halign: 'right', cellWidth: 50 },
        3: { halign: 'right', cellWidth: 95 },
        4: { halign: 'right', cellWidth: 95 },
      },
    });

    const tableBottom = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
    const totalsX = right - 210;
    let totalsY = tableBottom + 24;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Subtotal (${this.getTotalQuantity()} items)`, totalsX, totalsY);
    doc.text(this.formatAmount(order.subtotal || 0), right, totalsY, { align: 'right' });
    totalsY += 16;

    doc.text('Delivery Charge', totalsX, totalsY);
    doc.text(this.formatAmount(order.deliveryCharge || 0), right, totalsY, { align: 'right' });
    totalsY += 16;

    if ((order.discountAmount || 0) > 0) {
      const discountLabel = order.discountToken ? `Discount (${order.discountToken})` : 'Discount';
      doc.text(discountLabel, totalsX, totalsY);
      doc.text(`- ${this.formatAmount(order.discountAmount || 0)}`, right, totalsY, { align: 'right' });
      totalsY += 16;
    }

    doc.setDrawColor(210);
    doc.line(totalsX, totalsY - 6, right, totalsY - 6);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Due', totalsX, totalsY + 8);
    doc.text(this.formatAmount(order.totalAmount || 0), right, totalsY + 8, { align: 'right' });

    if (this.qrCodeUrl()) {
      try {
        doc.addImage(this.qrCodeUrl(), 'PNG', left, tableBottom + 10, 78, 78);
      } catch {
        // Ignore QR rendering issues and continue with PDF download.
      }
    }

    const footerNote = 'This is a computer-generated invoice and does not require a signature.';
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(110);
    doc.text(websiteUrl, left, doc.internal.pageSize.getHeight() - 56);
    doc.text(doc.splitTextToSize(footerNote, maxTextWidth), left, doc.internal.pageSize.getHeight() - 40);

    doc.save(`voucher-${this.orderId}.pdf`);
  }

  private formatAmount(value: number): string {
    const amount = Number(value || 0);
    return `BDT ${amount.toFixed(2)}`;
  }

  continueShopping() {
    this.router.navigate(['/shop']);
  }
}
