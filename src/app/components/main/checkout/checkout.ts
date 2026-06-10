import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BdtPipe } from '../../../pipes/bdt.pipe';
import { SOrder } from '../../../services/s-order';
import { SCart } from '../../../services/s-cart';
import { SAuthCookie } from '../../../services/s-auth-cookie';
import { SGuest } from '../../../services/s-guest';
import { SToast } from '../../../utils/toast/toast.service';
import { SContact } from '../../../services/s-contact';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-checkout',
  imports: [BdtPipe, FormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Checkout {
  private router = inject(Router);
  private orderService = inject(SOrder);
  private cartService = inject(SCart);
  private authCookie = inject(SAuthCookie);
  private guestService = inject(SGuest);
  private toast = inject(SToast);
  private contactService = inject(SContact);

  // Form fields
  name = '';
  phone = '';
  city = '';
  street = '';
  formTouched = signal(false);

  // Delivery charges
  deliveryCharge = signal(120);
  private deliveryCharges: Array<{ name: string; charge: number }> = [
    { name: 'Inside Dhaka', charge: 60 },
    { name: 'Outside Dhaka', charge: 120 },
  ];

  loading = signal(true);
  placingOrder = signal(false);
  error = signal<string | null>(null);
  orderItems = signal<any[]>([]);
  user = this.authCookie.getUserData();

  subtotal = computed(() =>
    this.orderItems().reduce((sum, item) => sum + Number(item.totalPrice || (item.price || 0) * (item.quantity || 1)), 0)
  );
  totalAmount = computed(() => this.subtotal() + this.deliveryCharge());

  ngOnInit() {
    this.loadDeliveryCharges();
    this.prefillFromUser();

    const orderData = history.state?.orderData;
    if (orderData?.products?.length) {
      this.orderItems.set(orderData.products);
      this.loading.set(false);
      return;
    }

    this.loadItemsFromCart();
  }

  private loadDeliveryCharges() {
    this.contactService.get(environment.companyCode).subscribe({
      next: (contact) => {
        // Use API charges directly without filtering
        const apiCharges = (contact?.deliveryCharges || [])
          .map((d: any) => ({
            name: d?.name || '',
            charge: Number(d?.amount ?? d?.charge ?? 0),
          }));

        // If API provides charges, use them; otherwise use fallback
        this.deliveryCharges = apiCharges.length
          ? apiCharges
          : [
            { name: 'Inside Dhaka', charge: 60 },
            { name: 'Outside Dhaka', charge: 120 },
          ];
        if (this.city) {
          this.updateDeliveryChargeByCity(this.city);
          return;
        }
        const outside = this.deliveryCharges.find((d: any) => this.normalizeCityName(d.name) === 'Outside Dhaka');
        if (outside) this.deliveryCharge.set(outside.charge);
      },
      error: () => {
        this.deliveryCharges = [
          { name: 'Inside Dhaka', charge: 60 },
          { name: 'Outside Dhaka', charge: 120 },
        ];
        this.deliveryCharge.set(120);
      },
    });
  }

  private prefillFromUser() {
    const u = this.user;
    const guestAddress = this.authCookie.getCheckoutAddress();

    if (u) {
      if (u.fullName) this.name = u.fullName;
      if (u.phone || u.shippingContact) this.phone = u.phone || u.shippingContact || '';
      if (u.shippingCity) {
        const normalized = this.normalizeCityName(u.shippingCity);
        this.city = normalized;
        this.updateDeliveryChargeByCity(normalized);
      }
      if (u.shippingStreet || u.address) this.street = u.shippingStreet || u.address || '';
      return;
    }

    if (guestAddress) {
      if (guestAddress.name) this.name = guestAddress.name;
      if (guestAddress.phone) this.phone = guestAddress.phone;
      if (guestAddress.city) {
        const normalized = this.normalizeCityName(guestAddress.city);
        this.city = normalized;
        this.updateDeliveryChargeByCity(normalized);
      }
      if (guestAddress.street) this.street = guestAddress.street;
    }
  }

  private saveCheckoutAddressToCookie() {
    this.authCookie.saveCheckoutAddress({
      name: this.name.trim(),
      phone: this.phone.trim(),
      city: this.selectedZoneLabel(),
      street: this.street.trim(),
      updatedAt: new Date().toISOString(),
    });
  }

  onCityChange(value: string = this.city) {
    this.city = this.normalizeCityName(value);
    this.updateDeliveryChargeByCity(this.city);
  }

  private updateDeliveryChargeByCity(city: string) {
    const normalized = this.normalizeCityName(city);
    const found = this.deliveryCharges.find(
      (c) => this.normalizeCityName(c.name) === normalized
    );
    if (found) {
      this.deliveryCharge.set(found.charge);
      return;
    }

    // Guaranteed fallback so UI still reacts even if API data is unavailable.
    this.deliveryCharge.set(normalized === 'Inside Dhaka' ? 60 : 120);
  }

  private normalizeCityName(value: string): string {
    const lower = (value || '').toLowerCase();
    if (lower.includes('inside')) return 'Inside Dhaka';
    if (lower.includes('outside')) return 'Outside Dhaka';
    if (lower.includes('dhaka')) return 'Inside Dhaka';
    return 'Outside Dhaka';
  }

  private selectedZoneLabel(): string {
    if (this.city) return this.city;
    if (this.deliveryCharges.length) {
      const outside = this.deliveryCharges.find((d) => this.normalizeCityName(d.name) === 'Outside Dhaka');
      if (outside) return 'Outside Dhaka';
    }
    return '';
  }

  private isFormValid(): boolean {
    return !!(this.name.trim() && this.phone.trim() && this.city && this.street.trim());
  }

  placeOrder() {
    this.formTouched.set(true);

    if (!this.orderItems().length || this.placingOrder()) return;

    if (!this.isFormValid()) {
      this.error.set('Please fill in all required fields before confirming your order.');
      return;
    }

    this.error.set(null);
    this.placingOrder.set(true);

    const currentUser = this.user;
    const userId = currentUser?.id || this.guestService.getGuestId() || 'guest';

    const order = {
      companyID: environment.companyCode,
      userId,
      userEmail: currentUser?.email || '',
      userName: this.name.trim(),
      userPhone: this.phone.trim(),
      subtotal: this.subtotal(),
      deliveryCharge: this.deliveryCharge(),
      totalAmount: this.totalAmount(),
      paymentMethod: 'Cash on Delivery',
      orderStatus: 'Pending',
      orderDate: new Date().toISOString(),
      shippingAddress: {
        district: this.selectedZoneLabel(),
        city: this.selectedZoneLabel(),
        area: '',
        street: this.street.trim(),
        contact: this.phone.trim(),
        type: 'Default',
      },
      orderItems: this.orderItems().map((item) => ({
        productId: Number(item.productId || item.id || 0),
        productName: item.productName || item.title || 'Product',
        quantity: Number(item.quantity || 1),
        price: Number(item.price || 0),
        size: item.selectSize || item.size || '',
        color: item.selectColor || item.color || '',
        image: item.image || item.displayImage || '',
      })),
    };

    this.orderService.add(order as any).subscribe({
      next: (response: any) => {
        this.saveCheckoutAddressToCookie();

        if (currentUser) {
          const zone = this.selectedZoneLabel();
          this.authCookie.login({
            ...currentUser,
            shippingDistrict: zone,
            shippingCity: zone,
            area: '',
            shippingStreet: this.street.trim(),
            shippingContact: this.phone.trim(),
            address: this.street.trim(),
            phone: this.phone.trim(),
          });
        }

        if (currentUser?.id) {
          this.cartService.clearCart(currentUser.id);
        } else {
          this.cartService.clearLocalCart();
        }
        this.cartService.refreshCartCount();
        this.toast.success('Order confirmed successfully!', 'top-right', 3000);
        this.router.navigate(['/order-confirmation'], {
          state: { orderId: response?.id },
        });
      },
      error: (err) => {
        this.error.set(err?.error || 'Failed to confirm order. Please try again.');
        this.placingOrder.set(false);
      },
    });
  }

  private loadItemsFromCart() {
    const customerId = this.cartService.getCustomerId();

    if (!customerId) {
      const localItems = this.cartService.getLocalCart();
      this.orderItems.set(localItems);
      this.loading.set(false);
      return;
    }

    this.cartService.search(customerId).subscribe({
      next: (carts) => {
        const items = carts?.[0]?.products || [];
        this.orderItems.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load items for checkout.');
        this.loading.set(false);
      },
    });
  }
}
