import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BdtPipe } from '../../../pipes/bdt.pipe';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faBoxOpen, faPrint } from '@fortawesome/free-solid-svg-icons';
import { SOrder } from '../../../services/s-order';
import { SAuthCookie } from '../../../services/s-auth-cookie';
import { Router } from '@angular/router';
import QRCode from 'qrcode';

@Component({
  selector: 'app-orders',
  imports: [CommonModule, FontAwesomeModule, BdtPipe],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders {
  faEye = faEye;
  faBoxOpen = faBoxOpen;
  faPrint = faPrint;

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
    if (!user?.email) {
      this.error.set('Please login to view your orders');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.orderService.search('', '', '', user.id).subscribe({
      next: (response: any) => {
        const allOrders = response?.$values || response || [];
        // Filter orders by the logged-in user's email or shippingContact
        const userOrders = allOrders.filter(
          (o: any) => o.userPhone === user.email || o.UserPhone === user.email ||
            o.userPhone === user.shippingContact || o.UserPhone === user.shippingContact
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
      'Confirm': 'bg-teal-100 text-teal-700',
      'Processing': 'bg-blue-100 text-blue-700',
      'Shipped': 'bg-primary-100 text-primary-700',
      'Delivered': 'bg-green-100 text-green-700',
      'Cancelled': 'bg-red-100 text-red-700',
      '0': 'bg-amber-100 text-amber-700',
      '1': 'bg-teal-100 text-teal-700',
      '2': 'bg-blue-100 text-blue-700',
      '3': 'bg-primary-100 text-primary-700',
      '4': 'bg-green-100 text-green-700',
      '5': 'bg-red-100 text-red-700',
    };
    return statusMap[String(status)] || 'bg-neutral-100 text-neutral-700';
  }

  getStatusText(status: string | number): string {
    const statusMap: Record<string, string> = {
      '0': 'Pending',
      '1': 'Confirm',
      '2': 'Processing',
      '3': 'Shipped',
      '4': 'Delivered',
      '5': 'Cancelled',
    };
    return statusMap[String(status)] || String(status);
  }

  trackOrder(order: any): void {
    this.router.navigate(['/account/order-tracking'], {
      queryParams: { orderId: order.id || order.Id },
    });
  }

  printVoucher(order: any): void {
    const orderId = order.id || order.Id;
    this.orderService.get(orderId).subscribe({
      next: async (data: any) => {
        const o = this.normalizeOrderForPrint(data);
        const qrDataUrl = await this.generateQrCode(orderId, o);
        this.openPrintWindow(orderId, o, qrDataUrl);
      },
      error: () => {
        this.error.set('Failed to load order for printing');
      }
    });
  }

  private async generateQrCode(orderId: any, o: any): Promise<string> {
    const items = o.orderItems.map((i: any) => `${i.productName} x${i.quantity} @${i.price}`).join('\n');
    const qrText = [
      `Order: #${orderId}`,
      `Date: ${new Date(o.orderDate).toLocaleDateString()}`,
      `Customer: ${o.userName}`,
      o.userPhone ? `Phone: ${o.userPhone}` : '',
      '---', items, '---',
      `Subtotal: ${o.subtotal}`,
      `Delivery: ${o.deliveryCharge}`,
      o.discountAmount > 0 ? `Discount: -${o.discountAmount}` : '',
      `Total: ${o.totalAmount}`,
      `Payment: ${o.paymentMethod}`,
    ].filter(Boolean).join('\n');
    try {
      return await QRCode.toDataURL(qrText, { width: 120, margin: 1, color: { dark: '#000000', light: '#ffffff' } });
    } catch { return ''; }
  }

  private normalizeOrderForPrint(o: any): any {
    const addr = o.shippingAddress ?? o.ShippingAddress ?? {};
    const rawItems = o.orderItems ?? o.OrderItems;
    const items = rawItems?.$values || rawItems || [];
    return {
      userName: o.userName ?? o.UserName ?? '',
      userPhone: o.userPhone ?? o.UserPhone ?? '',
      subtotal: o.subtotal ?? o.Subtotal ?? 0,
      deliveryCharge: o.deliveryCharge ?? o.DeliveryCharge ?? 0,
      totalAmount: o.totalAmount ?? o.TotalAmount ?? 0,
      paymentMethod: o.paymentMethod ?? o.PaymentMethod ?? '',
      orderStatus: o.orderStatus ?? o.OrderStatus ?? '',
      orderDate: o.orderDate ?? o.OrderDate ?? '',
      discountToken: o.discountToken ?? o.DiscountToken ?? '',
      discountAmount: o.discountAmount ?? o.DiscountAmount ?? 0,
      shippingAddress: {
        street: addr?.street ?? addr?.Street ?? '',
        city: addr?.city ?? addr?.City ?? '',
        district: addr?.district ?? addr?.District ?? '',
        contact: addr?.contact ?? addr?.Contact ?? '',
      },
      orderItems: items.map((item: any) => ({
        productName: item.productName ?? item.ProductName ?? '',
        quantity: item.quantity ?? item.Quantity ?? 1,
        price: item.price ?? item.Price ?? 0,
        size: item.size ?? item.Size ?? '',
        color: item.color ?? item.Color ?? '',
      })),
    };
  }

  private openPrintWindow(orderId: any, o: any, qrDataUrl: string): void {
    const statusMap: Record<string, string> = {
      '0': 'Pending', 'Pending': 'Pending', '1': 'Confirm', 'Confirm': 'Confirm',
      '2': 'Processing', 'Processing': 'Processing', '3': 'Shipped', 'Shipped': 'Shipped',
      '4': 'Delivered', 'Delivered': 'Delivered', '5': 'Cancelled', 'Cancelled': 'Cancelled',
    };
    const status = statusMap[String(o.orderStatus)] || String(o.orderStatus);
    const date = new Date(o.orderDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const fmt = (n: number) => '৳ ' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const totalQty = o.orderItems.reduce((s: number, i: any) => s + i.quantity, 0);

    const itemRows = o.orderItems.map((item: any, i: number) => {
      const variant = [item.size, item.color].filter(Boolean).map((v: string) => `<span style="font-size:10px;background:#f1f5f9;padding:1px 5px;border-radius:3px;color:#000">${v}</span>`).join(' ');
      return `<tr style="border-bottom:1px solid #e2e8f0">
        <td style="padding:10px 8px;text-align:center;color:#000;font-size:12px">${i + 1}</td>
        <td style="padding:10px 8px"><span style="font-weight:600;color:#000">${item.productName}</span>${variant ? '<br>' + variant : ''}</td>
        <td style="padding:10px 8px;text-align:center;color:#000">${item.quantity}</td>
        <td style="padding:10px 8px;text-align:right;color:#000">${fmt(item.price)}</td>
        <td style="padding:10px 8px;text-align:right;font-weight:600;color:#000">${fmt(item.price * item.quantity)}</td>
      </tr>`;
    }).join('');

    const discountRow = o.discountAmount > 0 ? `<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:13px;color:#000"><span>Discount${o.discountToken ? ' (' + o.discountToken + ')' : ''}</span><span>- ${fmt(o.discountAmount)}</span></div>` : '';

    const qrSection = qrDataUrl ? `<div style="display:flex;align-items:center;gap:12px">
            <img src="${qrDataUrl}" alt="QR Code" style="width:100px;height:100px;border:1px solid #e2e8f0;border-radius:8px" />
            <div><p style="font-size:11px;color:#000">Scan for order details</p><p style="font-size:13px;font-weight:700;color:#000;font-family:monospace;margin-top:4px">#${orderId}</p></div>
          </div>` : '';

    const html = `<!DOCTYPE html><html><head><title>Invoice #${orderId}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; color:#000; background:#fff; }
        .invoice { max-width:700px; margin:0 auto; padding:32px; }
        .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; }
        .meta-label { font-size:10px; text-transform:uppercase; letter-spacing:0.5px; color:#000; font-weight:700; }
        .addr-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:24px; }
        .addr-box { padding:12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; }
        .addr-title { font-size:10px; text-transform:uppercase; letter-spacing:0.5px; color:#000; font-weight:700; margin-bottom:6px; }
        .addr-name { font-size:13px; font-weight:600; color:#000; }
        .addr-detail { font-size:12px; color:#000; margin-top:2px; }
        table { width:100%; border-collapse:collapse; font-size:13px; color:#000; }
        th { font-size:10px; text-transform:uppercase; letter-spacing:0.5px; color:#000; font-weight:700; padding:10px 8px; border-bottom:2px solid #e2e8f0; text-align:left; }
        .bottom-section { display:flex; justify-content:space-between; align-items:end; margin-top:24px; gap:16px; flex-wrap:wrap; }
        .totals { width:260px; }
        .total-row { display:flex; justify-content:space-between; padding:3px 0; font-size:13px; color:#000; }
        .grand-total { display:flex; justify-content:space-between; align-items:center; padding-top:10px; margin-top:8px; border-top:2px solid #000; font-size:15px; font-weight:700; color:#000; }
        .grand-amount { font-size:18px; font-weight:800; color:#000; }
        .footer { text-align:center; margin-top:32px; padding-top:16px; border-top:1px solid #e2e8f0; }
        .footer p { font-size:12px; color:#000; }
        .footer .company { font-size:13px; font-weight:600; color:#000; margin-bottom:4px; }
        .badge { display:inline-block; font-size:10px; font-weight:700; padding:3px 10px; border-radius:20px; text-transform:uppercase; letter-spacing:0.3px; border:1px solid #000; color:#000; }
        @media print { body { margin:0; } .invoice { padding:20px; } }
      </style>
    </head><body>
      <div class="invoice">
        <div class="header">
          <div>
            <h1 style="font-size:22px;font-weight:800;color:#000;letter-spacing:-0.3px">Dream Express BD</h1>
            <p style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#000;font-weight:600;margin-top:2px">Order Invoice</p>
          </div>
          <div style="text-align:right">
            <div class="meta-label">Invoice No.</div>
            <div style="font-size:14px;font-weight:700;color:#000;font-family:monospace">#${orderId}</div>
            <div class="meta-label" style="margin-top:6px">Date</div>
            <div style="font-size:14px;font-weight:700;color:#000">${date}</div>
            <div class="badge" style="margin-top:8px">${status}</div>
          </div>
        </div>
        <div class="addr-grid">
          <div class="addr-box">
            <div class="addr-title">Bill To</div>
            <div class="addr-name">${o.userName || 'Customer'}</div>
            ${o.userPhone ? `<div class="addr-detail">${o.userPhone}</div>` : ''}
          </div>
          <div class="addr-box">
            <div class="addr-title">Ship To</div>
            <div class="addr-name">${o.shippingAddress.street}</div>
            <div class="addr-detail">${o.shippingAddress.city}${o.shippingAddress.district ? ', ' + o.shippingAddress.district : ''}</div>
            ${o.shippingAddress.contact ? `<div class="addr-detail">Phone: ${o.shippingAddress.contact}</div>` : ''}
          </div>
          <div class="addr-box">
            <div class="addr-title">Payment</div>
            <div class="addr-name">${o.paymentMethod}</div>
          </div>
        </div>
        <table>
          <thead><tr>
            <th style="text-align:center;width:40px">No</th><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th>
          </tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
        <div class="bottom-section">
          ${qrSection}
          <div class="totals">
            <div class="total-row"><span>Subtotal (${totalQty} items)</span><span>${fmt(o.subtotal)}</span></div>
            <div class="total-row"><span>Delivery Charge</span><span>${fmt(o.deliveryCharge)}</span></div>
            ${discountRow}
            <div class="grand-total"><span>Total Due</span><span class="grand-amount">${fmt(o.totalAmount)}</span></div>
          </div>
        </div>
        <div class="footer">
          <p class="company">Dream Express BD — Thank you for your order!</p>
          <p>This is a computer-generated invoice and does not require a signature.</p>
        </div>
      </div>
      <script>window.onload=function(){window.print();}<\/script>
    </body></html>`;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(html);
      printWin.document.close();
    }
  }
}
