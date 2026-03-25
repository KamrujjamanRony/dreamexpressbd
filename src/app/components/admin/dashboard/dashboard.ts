import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
    faShoppingBag, faMoneyBill, faClock, faTruck, faUsers, faBoxOpen,
    faTicket, faChartLine
} from '@fortawesome/free-solid-svg-icons';
import { SOrder } from '../../../services/s-order';
import { SProduct } from '../../../services/s-product';
import { SCustomer } from '../../../services/s-customer';
import { SToken } from '../../../services/s-token';
import { OrderM } from '../../../models/OrderM';
import { BdtPipe } from '../../../pipes/bdt.pipe';

@Component({
    selector: 'app-dashboard',
    imports: [CommonModule, RouterLink, FontAwesomeModule, DatePipe, BdtPipe],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
    faShoppingBag = faShoppingBag;
    faMoneyBill = faMoneyBill;
    faClock = faClock;
    faTruck = faTruck;
    faUsers = faUsers;
    faBoxOpen = faBoxOpen;
    faTicket = faTicket;
    faChartLine = faChartLine;

    private orderService = inject(SOrder);
    private productService = inject(SProduct);
    private customerService = inject(SCustomer);
    private tokenService = inject(SToken);

    orders = signal<OrderM[]>([]);
    totalProducts = signal(0);
    totalCustomers = signal(0);
    totalTokens = signal(0);
    isLoading = signal(true);

    // Computed stats
    totalOrders = computed(() => this.orders().length);
    totalRevenue = computed(() => this.orders().reduce((sum, o) => sum + (o.totalAmount || 0), 0));
    pendingOrders = computed(() => this.orders().filter(o => o.orderStatus === 'Pending').length);
    processingOrders = computed(() => this.orders().filter(o => o.orderStatus === 'Processing').length);
    shippedOrders = computed(() => this.orders().filter(o => o.orderStatus === 'Shipped').length);
    deliveredOrders = computed(() => this.orders().filter(o => o.orderStatus === 'Delivered').length);
    cancelledOrders = computed(() => this.orders().filter(o => o.orderStatus === 'Cancelled').length);

    // Chart data: order status distribution
    statusChartData = computed(() => {
        const total = this.totalOrders() || 1;
        return [
            { label: 'Pending', count: this.pendingOrders(), color: '#EAB308', pct: Math.round((this.pendingOrders() / total) * 100) },
            { label: 'Processing', count: this.processingOrders(), color: '#3B82F6', pct: Math.round((this.processingOrders() / total) * 100) },
            { label: 'Shipped', count: this.shippedOrders(), color: '#A855F7', pct: Math.round((this.shippedOrders() / total) * 100) },
            { label: 'Delivered', count: this.deliveredOrders(), color: '#22C55E', pct: Math.round((this.deliveredOrders() / total) * 100) },
            { label: 'Cancelled', count: this.cancelledOrders(), color: '#EF4444', pct: Math.round((this.cancelledOrders() / total) * 100) },
        ];
    });

    // Chart data: revenue by last 7 days
    revenueChartData = computed(() => {
        const days: { label: string; revenue: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().slice(0, 10);
            const dayLabel = date.toLocaleDateString('en', { weekday: 'short' });
            const revenue = this.orders()
                .filter(o => o.orderDate?.slice(0, 10) === dateStr)
                .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
            days.push({ label: dayLabel, revenue });
        }
        return days;
    });

    maxDailyRevenue = computed(() => {
        const max = Math.max(...this.revenueChartData().map(d => d.revenue), 1);
        return max;
    });

    // Recent orders
    recentOrders = computed(() =>
        [...this.orders()]
            .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
            .slice(0, 5)
    );

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);

        this.orderService.search().subscribe({
            next: (data) => {
                this.orders.set(data);
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
        });

        this.productService.search().subscribe({
            next: (data) => this.totalProducts.set(data.length),
            error: () => { }
        });

        this.customerService.search().subscribe({
            next: (data) => this.totalCustomers.set(data.length),
            error: () => { }
        });

        this.tokenService.search().subscribe({
            next: (data) => this.totalTokens.set(data.length),
            error: () => { }
        });
    }

    getStatusColor(status: string): string {
        const colors: { [key: string]: string } = {
            'Pending': 'bg-yellow-100 text-yellow-800',
            'Processing': 'bg-blue-100 text-blue-800',
            'Shipped': 'bg-purple-100 text-purple-800',
            'Delivered': 'bg-green-100 text-green-800',
            'Cancelled': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    }
}
