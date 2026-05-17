// order-list.component.ts
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faEye, faPencil, faTrash, faSearch,
  faFilter, faDownload, faSync, faCheckCircle,
  faTimesCircle, faTruck, faClock
} from '@fortawesome/free-solid-svg-icons';
import { DatePipe } from '@angular/common';
import { OrderForm } from './order-form/order-form';
import { OrderStatusUpdate } from './order-status-update/order-status-update';
import { BdtPipe } from '../../../pipes/bdt.pipe';
import { SOrder } from '../../../services/s-order';
import { SToast } from '../../../utils/toast/toast.service';
import { SConfirm } from '../../../utils/confirm/confirm.service';
import { SPermission } from '../../../services/s-permission';
import { OrderM } from '../../../models/OrderM';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { createQrDataUrl } from '../../../utils/qr-code';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, OrderForm, OrderStatusUpdate, BdtPipe, DatePipe],
  templateUrl: './order-list.html',
  styleUrls: ['./order-list.css']
})
export class OrderList implements OnInit {
  faEye = faEye;
  faPencil = faPencil;
  faTrash = faTrash;
  faSearch = faSearch;
  faFilter = faFilter;
  faDownload = faDownload;
  faSync = faSync;
  faCheckCircle = faCheckCircle;
  faTimesCircle = faTimesCircle;
  faTruck = faTruck;
  faClock = faClock;

  private orderService = inject(SOrder);
  private toast = inject(SToast);
  private confirm = inject(SConfirm);
  private permissionService = inject(SPermission);
  private router = inject(Router);

  // State
  orders = signal<OrderM[]>([]);
  isLoading = signal(false);
  hasError = signal(false);
  showForm = signal(false);
  showDetails = signal(false);
  selectedOrder = signal<OrderM | null>(null);
  isSubmitted = signal(false);
  searchQuery = signal('');
  selectedStatus = signal<string>('');
  dateFrom = signal<string>('');
  dateTo = signal<string>('');
  downloadingVoucherId = signal<number | null>(null);
  viewingOrder = signal<OrderM | null>(null);
  viewOrderLoading = signal(false);
  imgUrlBase = environment.ImageApi;

  // Permissions
  isView = signal(false);
  isInsert = signal(false);
  isEdit = signal(false);
  isDelete = signal(false);

  // Computed filtered orders
  filteredOrders = computed(() => {
    let result = this.orders();

    // Filter by search query
    const query = this.searchQuery().toLowerCase();
    if (query) {
      result = result.filter(order =>
        order.userName?.toLowerCase().includes(query) ||
        order.userEmail?.toLowerCase().includes(query) ||
        order.shippingAddress?.contact?.toLowerCase().includes(query) ||
        order.orderItems?.some(item => item.productName?.toLowerCase().includes(query)) ||
        order.id?.toString().includes(query)
      );
    }

    // Filter by status
    if (this.selectedStatus()) {
      result = result.filter(order => order.orderStatus === this.selectedStatus());
    }

    // Filter by date range
    if (this.dateFrom()) {
      const fromDate = new Date(this.dateFrom());
      result = result.filter(order => {
        const orderDate = new Date(order.orderDate);
        return orderDate >= fromDate;
      });
    }
    if (this.dateTo()) {
      const toDate = new Date(this.dateTo());
      toDate.setHours(23, 59, 59, 999); // Include the entire day
      result = result.filter(order => {
        const orderDate = new Date(order.orderDate);
        return orderDate <= toDate;
      });
    }

    // Sort by date (newest first)
    return result.sort((a, b) =>
      new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
    );
  });

  // Statistics
  totalOrders = computed(() => this.filteredOrders().length);
  totalRevenue = computed(() =>
    this.filteredOrders().reduce((sum, order) => sum + (order.totalAmount || 0), 0)
  );
  pendingOrders = computed(() =>
    this.filteredOrders().filter(o => o.orderStatus === 'Pending').length
  );
  deliveredOrders = computed(() =>
    this.filteredOrders().filter(o => o.orderStatus === 'Delivered').length
  );

  statusOptions = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Confirm', value: 'Confirm' },
    { label: 'Processing', value: 'Processing' },
    { label: 'Shipped', value: 'Shipped' },
    { label: 'Delivered', value: 'Delivered' },
    { label: 'Cancelled', value: 'Cancelled' }
  ];

  statusColors: { [key: string]: string } = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Confirm': 'bg-teal-100 text-teal-800',
    'Processing': 'bg-blue-100 text-blue-800',
    'Shipped': 'bg-primary-100 text-primary-800',
    'Delivered': 'bg-green-100 text-green-800',
    'Cancelled': 'bg-red-100 text-red-800'
  };

  ngOnInit() {
    this.loadPermissions();
    // Set default date range: last 1 week
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    this.dateFrom.set(this.formatDateForInput(weekAgo));
    this.dateTo.set(this.formatDateForInput(today));
    this.loadOrders();
  }

  loadPermissions() {
    this.isView.set(this.permissionService.hasPermission('Orders', 'view'));
    this.isInsert.set(this.permissionService.hasPermission('Orders', 'create'));
    this.isEdit.set(this.permissionService.hasPermission('Orders', 'edit'));
    this.isDelete.set(this.permissionService.hasPermission('Orders', 'delete'));
  }

  loadOrders() {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.orderService.search(
      this.dateFrom(),
      this.dateTo(),
      this.selectedStatus()
    ).subscribe({
      next: (data) => {
        this.orders.set(data.map(o => this.normalizeOrder(o)));
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.hasError.set(true);
        this.isLoading.set(false);
        this.toast.danger(error?.error || 'Failed to load orders', 'bottom-right', 3000);
      }
    });
  }

  private normalizeOrder(o: any): OrderM {
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
      id: o.id ?? o.Id,
      userName: o.userName ?? o.UserName ?? '',
      userEmail: o.userEmail ?? o.UserEmail ?? '',
      userPhone: o.userPhone ?? o.UserPhone ?? '',
      subtotal,
      deliveryCharge,
      totalAmount,
      discountToken,
      discountType,
      discountValue,
      discountAmount,
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

  refreshOrders() {
    this.loadOrders();
  }

  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onStatusFilter(event: Event) {
    this.selectedStatus.set((event.target as HTMLSelectElement).value);
    this.loadOrders();
  }

  onDateFromChange(event: Event) {
    this.dateFrom.set((event.target as HTMLInputElement).value);
    this.loadOrders();
  }

  onDateToChange(event: Event) {
    this.dateTo.set((event.target as HTMLInputElement).value);
    this.loadOrders();
  }

  resetFilters() {
    this.searchQuery.set('');
    this.selectedStatus.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.loadOrders();
  }

  private formatDateForInput(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  addOrder() {
    this.selectedOrder.set(null);
    this.showForm.set(true);
  }

  editOrder(order: OrderM) {
    this.orderService.get(order.id).subscribe({
      next: (fullOrder) => {
        this.selectedOrder.set(this.normalizeOrder(fullOrder));
        this.showForm.set(true);
      },
      error: (error) => {
        this.toast.danger(error?.error || 'Failed to load order details', 'bottom-right', 3000);
      }
    });
  }

  closeDetails() {
    this.showDetails.set(false);
    this.selectedOrder.set(null);
  }

  viewOrder(order: OrderM) {
    this.viewingOrder.set(null);
    this.viewOrderLoading.set(true);
    this.orderService.get(order.id).subscribe({
      next: (data: any) => {
        this.viewingOrder.set(this.normalizeOrder(data));
        this.viewOrderLoading.set(false);
      },
      error: () => {
        this.viewOrderLoading.set(false);
        this.toast.danger('Failed to load order details', 'bottom-right', 3000);
      }
    });
  }

  closeViewModal() {
    this.viewingOrder.set(null);
    this.viewOrderLoading.set(false);
  }

  onStatusUpdated(event: { id: number; status: string }) {
    this.updateOrderStatus({ id: event.id } as OrderM, event.status);
  }

  async deleteOrder(order: OrderM) {
    const confirmed = await this.confirm.confirm({
      message: `Are you sure you want to delete order #${order.id}?`,
      confirmText: 'Yes, delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });

    if (confirmed) {
      this.orderService.delete(order.id!).subscribe({
        next: () => {
          this.orders.update(orders => orders.filter(o => o.id !== order.id));
          this.toast.success('Order deleted successfully!', 'bottom-right', 3000);
        },
        error: (error) => {
          console.error('Error deleting order:', error);
          this.toast.danger(error?.error || 'Failed to delete order', 'bottom-right', 3000);
        }
      });
    }
  }

  updateOrderStatus(order: OrderM, newStatus: string) {
    this.orderService.update(order.id!, { orderStatus: newStatus }).subscribe({
      next: (updatedOrder) => {
        this.orders.update(orders =>
          orders.map(o => o.id === order.id ? this.normalizeOrder(updatedOrder) : o)
        );
        this.toast.success(`Order status updated to ${newStatus}`, 'bottom-right', 3000);
      },
      error: (error) => {
        console.error('Error updating order status:', error);
        this.toast.danger(error?.error || 'Failed to update order status', 'bottom-right', 3000);
      }
    });
  }

  onFormSubmit(orderData: Partial<OrderM>) {
    this.isSubmitted.set(true);

    const request$ = orderData.id
      ? this.orderService.update(orderData.id, orderData)
      : this.orderService.add(orderData as OrderM);

    request$.subscribe({
      next: (savedOrder) => {
        if (orderData.id) {
          // Update existing order
          this.orders.update(orders =>
            orders.map(o => o.id === savedOrder.id ? this.normalizeOrder(savedOrder) : o)
          );
          this.toast.success('Order updated successfully!', 'bottom-right', 3000);
        } else {
          // Add new order
          this.orders.update(orders => [this.normalizeOrder(savedOrder), ...orders]);
          this.toast.success('Order created successfully!', 'bottom-right', 3000);
        }
        this.showForm.set(false);
        this.isSubmitted.set(false);
      },
      error: (error) => {
        console.error('Error saving order:', error);
        this.toast.danger(
          error?.error || 'Failed to save order',
          'bottom-right',
          3000
        );
        this.isSubmitted.set(false);
      }
    });
  }

  onFormCancel() {
    this.showForm.set(false);
    this.selectedOrder.set(null);
  }

  getStatusColor(status: string): string {
    return this.statusColors[status] || 'bg-neutral-100 text-neutral-800';
  }

  downloadVoucherPdf(order: OrderM) {
    const orderId = order.id;
    if (!orderId || this.downloadingVoucherId() === orderId) {
      return;
    }

    this.downloadingVoucherId.set(orderId);
    this.orderService.get(orderId).subscribe({
      next: async (data: any) => {
        try {
          const o = this.normalizeOrderForPrint(data);
          const qrDataUrl = await this.generateQrCode(orderId, o);
          await this.generateVoucherPdf(orderId, o, qrDataUrl);
        } catch (err) {
          console.error('Voucher PDF generation failed:', err);
          this.toast.warning('Failed to generate voucher PDF', 'top-right', 3000);
        } finally {
          this.downloadingVoucherId.set(null);
        }
      },
      error: (err) => {
        console.error('Failed to load order for voucher:', err);
        this.downloadingVoucherId.set(null);
        this.toast.warning('Failed to load order for voucher download', 'top-right', 3000);
      }
    });
  }

  private async generateQrCode(orderId: any, o: any): Promise<string> {
    const items = o.orderItems.map((i: any) => `${i.productName} x${i.quantity} @${i.price}`).join('\n');
    const qrText = [
      `Order: #${orderId}`,
      `Date: ${this.formatDateDdMmYyyy(o.orderDate)}`,
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
      return await createQrDataUrl({
        text: qrText,
        size: 120,
        fill: '#000000',
        background: '#ffffff',
      });
    } catch { return ''; }
  }

  private normalizeOrderForPrint(o: any): any {
    const addr = o?.shippingAddress ?? o?.ShippingAddress ?? {};
    const rawItems = o.orderItems ?? o.OrderItems;
    const items = rawItems?.$values || rawItems || [];
    return {
      userName: o.userName ?? o.UserName ?? '',
      userPhone: o.userPhone ?? o.UserPhone ?? '',
      userEmail: o.userEmail ?? o.UserEmail ?? '',
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

  private async generateVoucherPdf(orderId: any, o: any, qrDataUrl: string): Promise<void> {
    const statusMap: Record<string, string> = {
      '0': 'Pending', 'Pending': 'Pending', '1': 'Processing', 'Processing': 'Processing',
      '2': 'Shipped', 'Shipped': 'Shipped', '3': 'Delivered', 'Delivered': 'Delivered',
      '4': 'Cancelled', 'Cancelled': 'Cancelled',
    };
    const status = statusMap[String(o.orderStatus)] || String(o.orderStatus);
    const date = this.formatDateDdMmYyyy(o.orderDate);
    const fmt = (n: number) => `BDT ${Number(n || 0).toFixed(2)}`;
    const totalQty = o.orderItems.reduce((s: number, i: any) => s + i.quantity, 0);

    const esc = (v: unknown) =>
      String(v ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

    const rowsHtml = o.orderItems.map((item: any, idx: number) => {
      const variant = [item.size, item.color].filter(Boolean).join(' / ');
      const label = variant ? `${item.productName} (${variant})` : item.productName;
      return `<tr>
        <td style="padding:7px 8px;border-bottom:1px solid #e5e7eb;text-align:center">${idx + 1}</td>
        <td style="padding:7px 8px;border-bottom:1px solid #e5e7eb">${esc(label)}</td>
        <td style="padding:7px 8px;border-bottom:1px solid #e5e7eb;text-align:right">${esc(item.quantity)}</td>
        <td style="padding:7px 8px;border-bottom:1px solid #e5e7eb;text-align:right">${esc(fmt(item.price || 0))}</td>
        <td style="padding:7px 8px;border-bottom:1px solid #e5e7eb;text-align:right">${esc(fmt((item.price || 0) * (item.quantity || 0)))}</td>
      </tr>`;
    }).join('');

    const addrLines = [
      o.shippingAddress?.street || '',
      o.shippingAddress?.city || ''
    ].filter(Boolean).join('<br>');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Voucher #${esc(orderId)}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Noto Sans Bengali', 'Segoe UI', Arial, sans-serif;
               color: #111827; background: #fff; padding: 28px 36px; font-size: 14px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .brand { font-size: 28px; font-weight: 800; }
        .brand-sub { font-size: 13px; color: #6b7280; margin-top: 2px; }
        .invoice-meta { text-align: right; line-height: 1.6; }
        .section { display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 16px; margin-bottom: 20px; }
        .section h4 { font-size: 13px; font-weight: 700; text-transform: uppercase;
                      letter-spacing: .04em; color: #6b7280; margin-bottom: 6px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        thead tr { background: #f3f4f6; }
        th { padding: 9px 8px; text-align: left; font-size: 12px; font-weight: 700;
             text-transform: uppercase; color: #374151; }
        th:not(:nth-child(2)) { text-align: right; }
        th:first-child { text-align: center; }
        .footer { display: flex; justify-content: space-between; align-items: flex-end; }
        .totals { min-width: 260px; }
        .totals .row { display: flex; justify-content: space-between; padding: 4px 0; }
        .totals .total-row { border-top: 2px solid #111827; margin-top: 6px; padding-top: 6px;
                             font-size: 16px; font-weight: 800; }
        .badge { display: inline-block; padding: 2px 10px; border-radius: 99px;
                 background: #d1fae5; color: #065f46; font-size: 12px; font-weight: 600; }
        @media print {
          body { padding: 16px 24px; }
          @page { margin: 0; size: A4; }
        }
      </style>
    </head><body>
      <div class="header">
        <div>
          <div class="brand">${esc(environment.companyName)}</div>
          <div class="brand-sub">${esc(environment.webUrl)} &nbsp;|&nbsp; Order Invoice</div>
        </div>
        <div class="invoice-meta">
          <div><strong>Invoice #${esc(orderId)}</strong></div>
          <div>Date: ${esc(date)}</div>
          <div><span class="badge">${esc(status)}</span></div>
        </div>
      </div>

      <div class="section">
        <div>
          <h4>Bill To</h4>
          <div>${esc(o.userName || 'Customer')}</div>
          ${o.shippingAddress?.contact ? `<div>Phone: ${esc(o.shippingAddress.contact)}</div>` : ''}
          ${o.userEmail ? `<div>${esc(o.userEmail)}</div>` : ''}
        </div>
        <div>
          <h4>Ship To</h4>
          <div>${addrLines}</div>
        </div>
        <div>
          <h4>Payment</h4>
          <div>${esc(o.paymentMethod || '')}</div>
        </div>
      </div>

      <table>
        <thead><tr>
          <th style="text-align:center;width:42px">#</th>
          <th style="text-align:left">Item</th>
          <th style="text-align:right">Qty</th>
          <th style="text-align:right">Price</th>
          <th style="text-align:right">Total</th>
        </tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>

      <div class="footer">
        <div>${qrDataUrl ? `<img src="${qrDataUrl}" style="width:100px;height:100px" alt="QR" />` : ''}</div>
        <div class="totals">
          <div class="row"><span>Subtotal (${totalQty} items)</span><span>${esc(fmt(o.subtotal || 0))}</span></div>
          <div class="row"><span>Delivery Charge</span><span>${esc(fmt(o.deliveryCharge || 0))}</span></div>
          ${(o.discountAmount || 0) > 0 ? `<div class="row"><span>${esc(o.discountToken ? `Discount (${o.discountToken})` : 'Discount')}</span><span>- ${esc(fmt(o.discountAmount || 0))}</span></div>` : ''}
          <div class="row total-row"><span>Total Due</span><span>${esc(fmt(o.totalAmount || 0))}</span></div>
        </div>
      </div>
    </body></html>`;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      throw new Error('Popup blocked — please allow popups for this site.');
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    // Small delay lets the browser finish layout before triggering print
    setTimeout(() => { printWindow.print(); }, 300);
  }

  private formatDateDdMmYyyy(value: unknown): string {
    const date = new Date(value as string | number | Date);
    if (Number.isNaN(date.getTime())) return '';
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  // Export to CSV
  exportToCSV() {
    const orders = this.filteredOrders();
    const headers = ['Order ID', 'Date', 'Phone', 'Customer Name', 'Shipping Address', 'Order Items', 'Subtotal', 'Delivery Charge', 'Total', 'Status'];
    const csvData = orders.map(order => [
      order.id,
      this.formatDateDdMmYyyy(order.orderDate),
      order.shippingAddress?.contact ?? '',
      order.userName,
      order.shippingAddress?.street ?? '',
      order.orderItems.map(i => `${i.productName} x${i.quantity}`).join(' | '),
      order.subtotal,
      order.deliveryCharge,
      order.totalAmount,
      order.orderStatus
    ]);

    const escape = (v: unknown) => {
      const s = v == null ? '' : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };

    const csvContent = [headers, ...csvData]
      .map(row => row.map(escape).join(','))
      .join('\r\n');

    // '\uFEFF' BOM tells Excel this is UTF-8 (required for Bangla / non-ASCII text)
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Export to PDF
  exportToPDF() {
    const orders = this.filteredOrders();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rows = orders.map(order => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">#${order.id}</td>
        <td style="padding:8px;border:1px solid #ddd">${this.formatDateDdMmYyyy(order.orderDate)}</td>
        <td style="padding:8px;border:1px solid #ddd">${order.shippingAddress?.contact}</td>
        <td style="padding:8px;border:1px solid #ddd">${order.userName}</td>
        <td style="padding:8px;border:1px solid #ddd">${order.shippingAddress?.street ?? ''}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right">${(order.subtotal || 0).toFixed(2)}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right">${(order.deliveryCharge || 0).toFixed(2)}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:bold">${(order.totalAmount || 0).toFixed(2)}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">${order.orderStatus}</td>
      </tr>
    `).join('');

    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Orders Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          h1 { color: #059669; margin-bottom: 4px; }
          .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { padding: 10px 8px; border: 1px solid #ddd; text-align: left; }
          .summary { margin-top: 16px; text-align: right; font-size: 16px; }
          .summary strong { color: #059669; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <h1>${environment.companyName} - Orders Report</h1>
        <p class="meta">Generated: ${new Date().toLocaleString()} | Total Orders: ${orders.length}</p>
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Date</th><th>Phone</th><th>Customer</th><th>Shipping Address</th>
              <th style="text-align:right">Subtotal</th><th style="text-align:right">Delivery</th>
              <th style="text-align:right">Total</th><th style="text-align:center">Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p class="summary">Total Revenue: <strong>${totalRevenue.toFixed(2)}</strong></p>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }
}
