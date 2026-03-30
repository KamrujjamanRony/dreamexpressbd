import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
    faMagnifyingGlass,
    faClipboardList,
    faClipboardCheck,
    faGear,
    faTruckFast,
    faCircleCheck,
    faCircleXmark,
    faBoxOpen,
    faLocationDot,
} from '@fortawesome/free-solid-svg-icons';
import { SOrder } from '../../../services/s-order';
import { BdtPipe } from '../../../pipes/bdt.pipe';

interface TrackingStep {
    label: string;
    icon: any;
    reached: boolean;
    active: boolean;
    date?: string;
}

@Component({
    selector: 'app-order-tracking',
    imports: [CommonModule, FormsModule, FontAwesomeModule, BdtPipe],
    templateUrl: './order-tracking.html',
    styleUrl: './order-tracking.css',
})
export class OrderTracking {
    private orderService = inject(SOrder);
    private route = inject(ActivatedRoute);

    faMagnifyingGlass = faMagnifyingGlass;
    faBoxOpen = faBoxOpen;
    faLocationDot = faLocationDot;

    searchId = '';
    loading = signal(false);
    error = signal('');
    order = signal<any>(null);
    steps = signal<TrackingStep[]>([]);

    private statusSteps = [
        { key: 'Pending', label: 'Order Placed', icon: faClipboardList, code: 0 },
        { key: 'Confirm', label: 'Confirm', icon: faClipboardCheck, code: 1 },
        { key: 'Processing', label: 'Processing', icon: faGear, code: 2 },
        { key: 'Shipped', label: 'Shipped', icon: faTruckFast, code: 3 },
        { key: 'Delivered', label: 'Delivered', icon: faCircleCheck, code: 4 },
    ];

    private cancelledStep = { key: 'Cancelled', label: 'Cancelled', icon: faCircleXmark, code: 5 };

    ngOnInit(): void {
        this.route.queryParams.subscribe((params) => {
            if (params['orderId']) {
                this.searchId = String(params['orderId']);
                this.trackOrder();
            }
        });
    }

    trackOrder(): void {
        const id = this.searchId.trim();
        if (!id) {
            this.error.set('Please enter an order ID');
            return;
        }

        this.loading.set(true);
        this.error.set('');
        this.order.set(null);

        this.orderService.get(id).subscribe({
            next: (data: any) => {
                if (!data) {
                    this.error.set('Order not found');
                    this.loading.set(false);
                    return;
                }
                this.order.set(data);
                this.buildSteps(data);
                this.loading.set(false);
            },
            error: (error) => {
                this.error.set(error?.error || 'Order not found or an error occurred');
                this.loading.set(false);
            },
        });
    }

    private buildSteps(order: any): void {
        const status = order.orderStatus ?? order.OrderStatus ?? order.orderStatus;
        const statusCode = typeof status === 'number' ? status : this.getStatusCode(String(status));
        const orderDate = order.orderDate || order.OrderDate;
        const deliveredDate = order.deliveredDate || order.DeliveredDate;

        if (statusCode === 5) {
            // Cancelled
            const result: TrackingStep[] = [
                { label: 'Order Placed', icon: faClipboardList, reached: true, active: false, date: orderDate },
                { label: 'Cancelled', icon: faCircleXmark, reached: true, active: true },
            ];
            this.steps.set(result);
            return;
        }

        const result: TrackingStep[] = this.statusSteps.map((step, i) => ({
            label: step.label,
            icon: step.icon,
            reached: statusCode >= step.code,
            active: statusCode === step.code,
            date:
                step.code === 0 ? orderDate : step.code === 4 && deliveredDate ? deliveredDate : undefined,
        }));

        this.steps.set(result);
    }

    private getStatusCode(status: string): number {
        const map: Record<string, number> = {
            Pending: 0,
            Confirm: 1,
            Processing: 2,
            Shipped: 3,
            Delivered: 4,
            Cancelled: 5,
        };
        return map[status] ?? 0;
    }

    getStatusText(status: string | number): string {
        const map: Record<string, string> = {
            '0': 'Pending',
            '1': 'Confirm',
            '2': 'Processing',
            '3': 'Shipped',
            '4': 'Delivered',
            '5': 'Cancelled',
        };
        return map[String(status)] || String(status);
    }

    getStatusClass(status: string | number): string {
        const map: Record<string, string> = {
            '0': 'bg-amber-100 text-amber-700',
            '1': 'bg-teal-100 text-teal-700',
            '2': 'bg-blue-100 text-blue-700',
            '3': 'bg-primary-100 text-primary-700',
            '4': 'bg-green-100 text-green-700',
            '5': 'bg-red-100 text-red-700',
            Pending: 'bg-amber-100 text-amber-700',
            Confirm: 'bg-teal-100 text-teal-700',
            Processing: 'bg-blue-100 text-blue-700',
            Shipped: 'bg-primary-100 text-primary-700',
            Delivered: 'bg-green-100 text-green-700',
            Cancelled: 'bg-red-100 text-red-700',
        };
        return map[String(status)] || 'bg-gray-100 text-gray-700';
    }
}
