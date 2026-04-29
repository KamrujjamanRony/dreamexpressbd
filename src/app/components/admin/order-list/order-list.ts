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
import { OrderDetails } from './order-details/order-details';
import { OrderStatusUpdate } from './order-status-update/order-status-update';
import { BdtPipe } from '../../../pipes/bdt.pipe';
import { SOrder } from '../../../services/s-order';
import { SToast } from '../../../utils/toast/toast.service';
import { SConfirm } from '../../../utils/confirm/confirm.service';
import { SPermission } from '../../../services/s-permission';
import { OrderM } from '../../../models/OrderM';
import { Router } from '@angular/router';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, OrderForm, OrderDetails, OrderStatusUpdate, BdtPipe, DatePipe],
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
        order.userPhone?.includes(query) ||
        order.id?.toString().includes(query)
      );
    }

    // Filter by status
    if (this.selectedStatus()) {
      result = result.filter(order => order.orderStatus === this.selectedStatus());
    }

    // Filter by date range
    if (this.dateFrom()) {
      result = result.filter(order => order.orderDate >= this.dateFrom());
    }
    if (this.dateTo()) {
      result = result.filter(order => order.orderDate <= this.dateTo());
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

  viewOrder(order: OrderM) {
    this.orderService.get(order.id).subscribe({
      next: (fullOrder) => {
        this.selectedOrder.set(this.normalizeOrder(fullOrder));
        this.showDetails.set(true);
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
    this.orderService.get(orderId).subscribe({
      next: async (data: any) => {
        const o = this.normalizeOrderForPrint(data);
        const qrDataUrl = await this.generateQrCode(orderId, o);
        this.generateVoucherPdf(orderId, o, qrDataUrl);
      },
      error: () => {
        this.toast.warning('Failed to load order for voucher download', 'top-right', 3000);
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

  private generateVoucherPdf(orderId: any, o: any, qrDataUrl: string): void {
    const statusMap: Record<string, string> = {
      '0': 'Pending', 'Pending': 'Pending', '1': 'Processing', 'Processing': 'Processing',
      '2': 'Shipped', 'Shipped': 'Shipped', '3': 'Delivered', 'Delivered': 'Delivered',
      '4': 'Cancelled', 'Cancelled': 'Cancelled',
    };
    const status = statusMap[String(o.orderStatus)] || String(o.orderStatus);
    const date = new Date(o.orderDate).toLocaleDateString();
    const fmt = (n: number) => `BDT ${Number(n || 0).toFixed(2)}`;
    const totalQty = o.orderItems.reduce((s: number, i: any) => s + i.quantity, 0);

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const left = 40;
    const right = doc.internal.pageSize.getWidth() - 40;
    const websiteUrl = environment.webUrl;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(environment.companyName, left, 50);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text('Order Invoice', left, 68);
    doc.setFontSize(9.5);
    doc.text(websiteUrl, left, 82);

    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Invoice: #${orderId}`, right, 50, { align: 'right' });
    doc.text(`Date: ${date}`, right, 66, { align: 'right' });
    doc.text(`Status: ${status}`, right, 82, { align: 'right' });

    let y = 112;
    doc.setFontSize(10);
    doc.text('Bill To', left, y);
    doc.text('Ship To', left + 185, y);
    doc.text('Payment', left + 370, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    const billTo = [o.userName || 'Customer', o.userPhone || '', o.userEmail || ''].filter(Boolean).join('\n');
    const shipTo = [
      o.shippingAddress?.street || '',
      [o.shippingAddress?.city || '', o.shippingAddress?.district || ''].filter(Boolean).join(', '),
      o.shippingAddress?.contact ? `Phone: ${o.shippingAddress.contact}` : '',
    ].filter(Boolean).join('\n');

    doc.text(doc.splitTextToSize(billTo, 165), left, y + 14);
    doc.text(doc.splitTextToSize(shipTo, 165), left + 185, y + 14);
    doc.text(doc.splitTextToSize(o.paymentMethod || '', 165), left + 370, y + 14);

    y = 180;
    autoTable(doc, {
      startY: y,
      margin: { left, right: 40 },
      head: [['No', 'Item', 'Qty', 'Price', 'Total']],
      body: o.orderItems.map((item: any, index: number) => {
        const variant = [item.size, item.color].filter(Boolean).join(' / ');
        const itemLabel = variant ? `${item.productName} (${variant})` : item.productName;
        return [
          String(index + 1),
          itemLabel,
          String(item.quantity || 0),
          fmt(item.price || 0),
          fmt((item.price || 0) * (item.quantity || 0)),
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
    doc.text(`Subtotal (${totalQty} items)`, totalsX, totalsY);
    doc.text(fmt(o.subtotal || 0), right, totalsY, { align: 'right' });
    totalsY += 16;

    doc.text('Delivery Charge', totalsX, totalsY);
    doc.text(fmt(o.deliveryCharge || 0), right, totalsY, { align: 'right' });
    totalsY += 16;

    if ((o.discountAmount || 0) > 0) {
      const discountLabel = o.discountToken ? `Discount (${o.discountToken})` : 'Discount';
      doc.text(discountLabel, totalsX, totalsY);
      doc.text(`- ${fmt(o.discountAmount || 0)}`, right, totalsY, { align: 'right' });
      totalsY += 16;
    }

    doc.setDrawColor(210);
    doc.line(totalsX, totalsY - 6, right, totalsY - 6);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Due', totalsX, totalsY + 8);
    doc.text(fmt(o.totalAmount || 0), right, totalsY + 8, { align: 'right' });

    if (qrDataUrl) {
      try {
        doc.addImage(qrDataUrl, 'PNG', left, tableBottom + 10, 78, 78);
      } catch {
        // Ignore QR rendering issues and continue with PDF download.
      }
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(110);
    doc.text(websiteUrl, left, doc.internal.pageSize.getHeight() - 56);
    doc.text(
      'This is a computer-generated invoice and does not require a signature.',
      left,
      doc.internal.pageSize.getHeight() - 40
    );

    doc.save(`voucher-${orderId}.pdf`);
  }

  // Export to CSV
  exportToCSV() {
    const orders = this.filteredOrders();
    const headers = ['Order ID', 'Customer Name', 'Email', 'Phone', 'Total', 'Status', 'Date'];
    const csvData = orders.map(order => [
      order.id,
      order.userName,
      order.userEmail,
      order.userPhone,
      order.totalAmount,
      order.orderStatus,
      new Date(order.orderDate).toLocaleDateString()
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
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
        <td style="padding:8px;border:1px solid #ddd">${order.userName}</td>
        <td style="padding:8px;border:1px solid #ddd">${order.userEmail}</td>
        <td style="padding:8px;border:1px solid #ddd">${order.userPhone}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right">৳ ${(order.subtotal || 0).toFixed(2)}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right">৳ ${(order.deliveryCharge || 0).toFixed(2)}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:bold">৳ ${(order.totalAmount || 0).toFixed(2)}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">${order.orderStatus}</td>
        <td style="padding:8px;border:1px solid #ddd">${new Date(order.orderDate).toLocaleDateString()}</td>
      </tr>
    `).join('');

    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${environment.companyName} - Orders Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          h1 { color: #059669; margin-bottom: 4px; }
          .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th { padding: 10px 8px; border: 1px solid #ddd; background: #059669; color: white; text-align: left; }
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
              <th>ID</th><th>Customer</th><th>Email</th><th>Phone</th>
              <th style="text-align:right">Subtotal</th><th style="text-align:right">Delivery</th>
              <th style="text-align:right">Total</th><th style="text-align:center">Status</th><th>Date</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p class="summary">Total Revenue: <strong>৳ ${totalRevenue.toFixed(2)}</strong></p>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }
}
