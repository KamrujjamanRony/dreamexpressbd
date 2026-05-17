import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { BdtPipe } from '../../../pipes/bdt.pipe';
import { ActivatedRoute, Router } from '@angular/router';
import { SOrder } from '../../../services/s-order';
import { environment } from '../../../../environments/environment';
import html2canvas from 'html2canvas/dist/html2canvas.esm.js';
import jsPDF from 'jspdf';
import { SMetaPixel } from '../../../services/s-meta-pixel';
import { SToast } from '../../../utils/toast/toast.service';
import { createQrDataUrl } from '../../../utils/qr-code';

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
  private metaPixel = inject(SMetaPixel);
  private toast = inject(SToast);

  orderId: string | null = null;
  orderDetails: any = null;
  loading = true;
  ready = signal(false);
  downloadingVoucher = signal(false);
  imgBaseUrl = environment.ImageApi;
  companyName = environment.companyName;
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
        this.trackPurchaseOnce();
        this.generateQrCode();
        setTimeout(() => this.ready.set(true), 50);
      },
      error: (error: any) => {
        console.error('Error loading order:', error);
        this.router.navigate(['/']);
      }
    });
  }

  private async generateQrCode() {
    const o = this.orderDetails;
    const items = this.getOrderItems()
      .map((i: any) => `${i.productName} x${i.quantity} @${i.price}`)
      .join('\n');
    const qrText = [
      `Order: #${this.orderId}`,
      `Date: ${this.formatDateDdMmYyyy(o.orderDate)}`,
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

    try {
      this.qrCodeUrl.set(
        await createQrDataUrl({
          text: qrText,
          size: 120,
          fill: '#111827',
          background: '#ffffff',
        }),
      );
    } catch {
      this.qrCodeUrl.set('');
    }
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

  private trackPurchaseOnce() {
    if (!this.orderId || !this.orderDetails) return;

    const storageKey = `meta_purchase_${this.orderId}`;
    try {
      if (sessionStorage.getItem(storageKey)) return;
    } catch {
      // Ignore storage access failures and continue tracking.
    }

    const orderItems = this.getOrderItems();
    this.metaPixel.trackPurchase({
      orderId: String(this.orderId),
      value: Number(this.orderDetails.totalAmount || 0),
      num_items: orderItems.reduce((sum: number, item: any) => sum + Number(item.quantity || 1), 0),
      contents: this.metaPixel.createContents(
        orderItems.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        }))
      ),
    });

    try {
      sessionStorage.setItem(storageKey, '1');
    } catch {
      // Ignore storage access failures.
    }
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

  async downloadVoucherPdf() {
    if (!this.orderDetails || !this.orderId || this.downloadingVoucher()) {
      return;
    }

    this.downloadingVoucher.set(true);

    const order = this.orderDetails;
    const totalQty = this.getTotalQuantity();
    const fmt = (n: number) => `BDT ${Number(n || 0).toFixed(2)}`;
    const escapeHtml = (value: unknown) =>
      String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const rowsHtml = this.getOrderItems()
      .map((item: any, index: number) => {
        const variant = [item.size, item.color].filter(Boolean).join(' / ');
        const itemLabel = variant ? `${item.productName} (${variant})` : item.productName;
        return `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">${index + 1}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(itemLabel)}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${escapeHtml(item.quantity)}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${escapeHtml(fmt(item.price || 0))}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${escapeHtml(fmt((item.price || 0) * (item.quantity || 0)))}</td>
          </tr>
        `;
      })
      .join('');

    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.left = '-10000px';
    wrapper.style.top = '0';
    wrapper.style.width = '794px';
    wrapper.style.background = '#ffffff';
    wrapper.style.color = '#111827';
    wrapper.style.fontFamily = "'Noto Sans Bengali', 'Inter', 'Segoe UI', sans-serif";
    wrapper.style.padding = '28px 36px';
    wrapper.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:24px;">
        <div>
          <div style="font-size:34px;font-weight:800;line-height:1.05;">${escapeHtml(environment.companyName)}</div>
          <div style="font-size:16px;font-weight:800;margin-top:4px;">Order Invoice</div>
          <div style="font-size:14px;margin-top:2px;">${escapeHtml(environment.webUrl)}</div>
        </div>
        <div style="text-align:right;font-size:16px;font-weight:700;line-height:1.35;">
          <div>Invoice: #${escapeHtml(this.orderId)}</div>
          <div>Date: ${escapeHtml(this.formatDateDdMmYyyy(order.orderDate))}</div>
          <div>Status: ${escapeHtml(this.getOrderStatusText(order.orderStatus))}</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 2fr 1fr;gap:18px;margin-top:22px;">
        <div>
          <div style="font-size:16px;font-weight:700;margin-bottom:6px;">Bill To</div>
          <div style="font-size:14px;line-height:1.35;white-space:pre-line;">${escapeHtml([
      order.userName || 'Customer',
      order.userPhone || '',
      order.userEmail || '',
    ].filter(Boolean).join('\n'))}</div>
        </div>
        <div>
          <div style="font-size:16px;font-weight:700;margin-bottom:6px;">Ship To</div>
          <div style="font-size:14px;line-height:1.35;white-space:pre-line;">${escapeHtml([
      order.shippingAddress?.street || '',
      [order.shippingAddress?.city || ''].filter(Boolean).join(', '),
      order.shippingAddress?.contact ? `Phone: ${order.shippingAddress.contact}` : '',
    ].filter(Boolean).join('\n'))}</div>
        </div>
        <div>
          <div style="font-size:16px;font-weight:700;margin-bottom:6px;">Payment</div>
          <div style="font-size:14px;line-height:1.35;">${escapeHtml(order.paymentMethod || '')}</div>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-top:22px;font-size:14px;">
        <thead>
          <tr style="background:#f3f4f6;color:#374151;">
            <th style="padding:9px;text-align:center;width:48px;">No</th>
            <th style="padding:9px;text-align:left;">Item</th>
            <th style="padding:9px;text-align:right;">Qty</th>
            <th style="padding:9px;text-align:right;">Price</th>
            <th style="padding:9px;text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>

      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-top:18px;">
        <div style="width:110px;height:110px;">${this.qrCodeUrl() ? `<img src="${this.qrCodeUrl()}" alt="QR" style="width:110px;height:110px;" />` : ''}</div>
        <div style="min-width:320px;font-size:14px;line-height:1.55;">
          <div style="display:flex;justify-content:space-between;"><span>Subtotal (${totalQty} items)</span><strong>${escapeHtml(fmt(order.subtotal || 0))}</strong></div>
          <div style="display:flex;justify-content:space-between;"><span>Delivery Charge</span><strong>${escapeHtml(fmt(order.deliveryCharge || 0))}</strong></div>
          ${(order.discountAmount || 0) > 0 ? `<div style="display:flex;justify-content:space-between;"><span>${escapeHtml(order.discountToken ? `Discount (${order.discountToken})` : 'Discount')}</span><strong>- ${escapeHtml(fmt(order.discountAmount || 0))}</strong></div>` : ''}
          <div style="border-top:1px solid #d1d5db;margin-top:8px;padding-top:8px;display:flex;justify-content:space-between;font-size:16px;font-weight:800;"><span>Total Due</span><span>${escapeHtml(fmt(order.totalAmount || 0))}</span></div>
        </div>
      </div>
    `;

    document.body.appendChild(wrapper);

    try {
      if ('fonts' in document) {
        await (document as Document & { fonts: FontFaceSet }).fonts.ready;
      }

      const canvas = await html2canvas(wrapper, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        windowWidth: wrapper.scrollWidth,
      });

      const imgData = canvas.toDataURL('image/png');
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      doc.save(`voucher-${this.orderId}.pdf`);
    } catch {
      this.toast.warning('Failed to generate voucher PDF', 'top-right', 3000);
    } finally {
      wrapper.remove();
      this.downloadingVoucher.set(false);
    }
  }

  continueShopping() {
    this.router.navigate(['/shop']);
  }

  private formatDateDdMmYyyy(value: unknown): string {
    const date = new Date(value as string | number | Date);
    if (Number.isNaN(date.getTime())) return '';
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
}
