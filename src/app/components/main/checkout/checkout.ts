import { Component, computed, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BdtPipe } from '../../../pipes/bdt.pipe';
import { Router } from '@angular/router';
import { SCart } from '../../../services/s-cart';
import { SOrder } from '../../../services/s-order';
import { SCustomer } from '../../../services/s-customer';
import { SToken } from '../../../services/s-token';
import { SAuthCookie } from '../../../services/s-auth-cookie';
import { SGuest } from '../../../services/s-guest';
import { SToast } from '../../../utils/toast/toast.service';
import { TokenM } from '../../../models/TokenM';
import { environment } from '../../../../environments/environment';
import { OrderM } from '../../../models/OrderM';
import { SContact } from '../../../services/s-contact';
import { DeliveryChargeM } from '../../../models/Contact';
import { SData } from '../../../services/s-data';

@Component({
    selector: 'app-checkout',
    imports: [FormsModule, BdtPipe, NgClass],
    templateUrl: './checkout.html',
    styleUrl: './checkout.css',
})
export class Checkout {
    private router = inject(Router);
    private cartService = inject(SCart);
    private orderService = inject(SOrder);
    private customerService = inject(SCustomer);
    private tokenService = inject(SToken);
    private authCookie = inject(SAuthCookie);
    private guestService = inject(SGuest);
    private toast = inject(SToast);
    private contactService = inject(SContact);
    private dataService = inject(SData);

    siteId = environment.companyCode;
    imgBaseUrl = environment.ImageApi;
    orderData: any;
    user: any;
    userDetails: any;
    isGuest = false;
    loading = signal(false);
    placingOrder = signal(false);
    error = signal<string | null>(null);
    paymentMethod = 'Cash on Delivery';
    deliveryCharge = signal<number>(0);
    deliveryAddress = signal<any>(null);
    userAddresses = signal<any[]>([]);
    selectedAddressId = signal<string | null>(null);
    apiDeliveryCharges = signal<DeliveryChargeM[]>([]);

    // Address form fields (shared for both guest and logged-in)
    guestName = '';
    guestPhone = '';
    guestDistrict = '';
    guestCity = '';
    guestArea = '';
    guestStreet = '';

    // Dropdown data
    regions = signal<any[]>([]);
    cities = signal<any[]>([]);
    areas = signal<any[]>([]);

    // Discount token
    tokenCode = '';
    tokenError = '';
    tokenApplied = signal(false);
    tokenLoading = signal(false);
    discountToken = signal<string>('');
    discountType = signal<string>('');
    discountValue = signal<number>(0);
    discountAmount = signal<number>(0);

    // Animation state
    ready = signal(false);

    // Step tracking
    activeStep = signal(1);

    // Computed totals
    effectiveDeliveryCharge = computed(() =>
        this.tokenApplied() && this.discountType() === 'FreeDelivery' ? 0 : this.deliveryCharge()
    );
    orderTotal = computed(() =>
        Math.max(0, (this.orderData?.subtotal || 0) + this.effectiveDeliveryCharge() - this.discountAmount())
    );

    constructor() {
        const navigation = this.router.currentNavigation();
        this.orderData = navigation?.extras.state?.['orderData'] ||
            history.state?.orderData;
    }

    ngOnInit() {
        this.user = this.authCookie.getUserData();
        if (this.user) {
            this.isGuest = false;
            this.loadUserDetails(this.user.id);
        } else {
            this.isGuest = true;
        }

        if (!this.orderData?.products?.length) {
            this.toast.warning('Your cart is empty', 'top-right', 3000);
            this.router.navigate(['/cart']);
            return;
        }

        // Load regions for district dropdown
        this.dataService.getRegions().subscribe(regions => this.regions.set(regions));

        // Load delivery charges from API
        this.contactService.get(this.siteId).subscribe({
            next: (data) => {
                const activeCharges = (data.deliveryCharges || []).filter(c => c.isActive);
                this.apiDeliveryCharges.set(activeCharges);
                this.setDefaultDeliveryCharge();
            },
            error: () => {
                // fallback default: outside Dhaka
                this.deliveryCharge.set(120);
            }
        });

        setTimeout(() => this.ready.set(true), 50);
    }

    private setDefaultDeliveryCharge() {
        const charges = this.apiDeliveryCharges();
        if (charges.length > 0) {
            const outsideCharge = charges.find(c => c.name.toLowerCase().includes('outside'));
            this.deliveryCharge.set(outsideCharge ? outsideCharge.amount : charges[charges.length - 1].amount);
        } else {
            this.deliveryCharge.set(120);
        }
    }

    private calculateDeliveryCharge() {
        const city = (this.deliveryAddress()?.city || '').toLowerCase();
        this.updateDeliveryChargeByDistrict(city);
    }

    private updateDeliveryChargeByDistrict(district: string) {
        district = (district || '').toLowerCase();
        const charges = this.apiDeliveryCharges();

        if (charges.length > 0) {
            const match = charges.find(c =>
                district.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(district)
            );
            if (match) {
                this.deliveryCharge.set(match.amount);
            } else if (district.includes('dhaka')) {
                const dhakaCharge = charges.find(c => c.name.toLowerCase().includes('dhaka'));
                this.deliveryCharge.set(dhakaCharge ? dhakaCharge.amount : charges[charges.length - 1].amount);
            } else {
                const outsideCharge = charges.find(c => c.name.toLowerCase().includes('outside'));
                this.deliveryCharge.set(outsideCharge ? outsideCharge.amount : charges[charges.length - 1].amount);
            }
        } else {
            if (district.includes('dhaka')) {
                this.deliveryCharge.set(60);
            } else {
                this.deliveryCharge.set(120);
            }
        }
    }

    applyToken() {
        const code = this.tokenCode.trim();
        if (!code) {
            this.tokenError = 'Please enter a token code';
            return;
        }

        this.tokenLoading.set(true);
        this.tokenError = '';

        this.tokenService.search().subscribe({
            next: (tokens: TokenM[]) => {
                const token = tokens.find(t => t.code.toLowerCase() === code.toLowerCase());

                if (!token) {
                    this.tokenError = 'This discount code does not exist';
                    this.tokenLoading.set(false);
                    return;
                }

                if (!token.isActive) {
                    this.tokenError = 'This discount code is inactive';
                    this.tokenLoading.set(false);
                    return;
                }

                if (new Date(token.expireAt) < new Date()) {
                    this.tokenError = 'This discount code has expired';
                    this.tokenLoading.set(false);
                    return;
                }

                if (token.usedCount >= token.maxUseCount) {
                    this.tokenError = 'This discount code has reached its usage limit';
                    this.tokenLoading.set(false);
                    return;
                }

                const subtotal = this.orderData?.subtotal || 0;

                if (token.type === 'FreeDelivery') {
                    this.discountToken.set(token.code);
                    this.discountType.set('FreeDelivery');
                    this.discountValue.set(token.value);
                    this.discountAmount.set(0);
                } else if (token.type === 'Percentage') {
                    const amount = Math.min(Math.round((subtotal * token.value) / 100), subtotal);
                    this.discountToken.set(token.code);
                    this.discountType.set('Percentage');
                    this.discountValue.set(token.value);
                    this.discountAmount.set(amount);
                } else {
                    const amount = Math.min(token.value, subtotal);
                    this.discountToken.set(token.code);
                    this.discountType.set('Fixed');
                    this.discountValue.set(token.value);
                    this.discountAmount.set(amount);
                }

                this.tokenApplied.set(true);
                this.tokenLoading.set(false);
                this.toast.success('Discount applied!', 'top-right', 2000);
            },
            error: (error) => {
                this.tokenError = error?.error || 'Failed to validate token';
                this.tokenLoading.set(false);
            }
        });
    }

    removeToken() {
        this.discountToken.set('');
        this.discountType.set('');
        this.discountValue.set(0);
        this.discountAmount.set(0);
        this.tokenCode = '';
        this.tokenError = '';
        this.tokenApplied.set(false);
        this.calculateDeliveryCharge();
    }

    loadUserDetails(userId: string) {
        this.loading.set(true);
        this.customerService.search(userId).subscribe({
            next: (data) => {
                this.userDetails = data?.[0];
                this.loading.set(false);
                // Pre-fill address from user profile (prefer shipping address if available)
                if (this.userDetails) {
                    const district = this.userDetails.shippingDistrict || this.userDetails.dist || '';
                    const street = this.userDetails.shippingStreet || this.userDetails.address || '';
                    const contact = this.userDetails.shippingContact || '';
                    const area = this.userDetails.area || '';

                    if (district) {
                        this.onDistrictChange(district);

                        // Pre-fill city after cities load
                        const city = this.userDetails.shippingCity || '';
                        if (city) {
                            this.dataService.getCitiesByRegion(district).subscribe(cities => {
                                this.cities.set(cities);
                                this.guestCity = city;
                                this.onCityChange(city);
                            });
                        }
                    }
                    if (street) this.guestStreet = street;
                    if (contact) this.guestPhone = contact;
                    if (area) this.guestArea = area;
                }
            },
            error: (error) => {
                this.error.set(error?.error || 'Failed to load user details');
                this.loading.set(false);
            }
        });
    }

    onDistrictChange(district: string) {
        this.guestDistrict = district;
        this.guestCity = '';
        this.guestArea = '';
        this.cities.set([]);
        this.areas.set([]);
        if (district) {
            this.dataService.getCitiesByRegion(district).subscribe(cities => this.cities.set(cities));
        }
    }

    onCityChange(city: string) {
        this.guestCity = city;
        this.guestArea = '';
        this.areas.set([]);
        if (city) {
            this.dataService.getAreasByCity(city).subscribe(areas => this.areas.set(areas));
            // Update delivery charge based on selected city
            this.updateDeliveryChargeByDistrict(city);
        }
    }

    goToStep(step: number) {
        if (step === 2) {
            if (this.isGuest) {
                if (!this.guestName.trim() || !this.guestPhone.trim() || !this.guestDistrict.trim() || !this.guestCity.trim() || !this.guestStreet.trim()) {
                    this.toast.warning('Please fill in all delivery details', 'top-right', 2000);
                    return;
                }
            } else {
                if (!this.guestDistrict.trim() || !this.guestCity.trim() || !this.guestStreet.trim()) {
                    this.toast.warning('Please fill in all delivery details', 'top-right', 2000);
                    return;
                }
            }
            // Set delivery address from form
            this.deliveryAddress.set({
                street: this.guestStreet.trim(),
                city: this.guestCity.trim(),
                district: this.guestDistrict.trim(),
                area: this.guestArea.trim(),
                contact: this.isGuest ? this.guestPhone.trim() : (this.userDetails?.phone || ''),
                type: 'Home',
            });
            this.calculateDeliveryCharge();
        }
        this.activeStep.set(step);
    }

    placeOrder() {
        if (!this.deliveryAddress()) {
            this.error.set('Please provide a delivery address');
            return;
        }

        if (!this.orderData?.products?.length) {
            this.error.set('No products in cart');
            return;
        }

        if (this.isGuest && (!this.guestName.trim() || !this.guestPhone.trim())) {
            this.error.set('Please provide your name and phone number');
            return;
        }

        this.placingOrder.set(true);
        this.error.set(null);

        const orderItems = this.orderData.products.map((item: any) => ({
            productId: item.productId,
            productName: item.productName || '',
            quantity: item.quantity || 1,
            price: item.price || 0,
            size: item.selectSize || '',
            color: item.selectColor || '',
            image: item.image || ''
        }));

        const order: OrderM = {
            userId: this.isGuest ? (this.guestService.getGuestId() || 'guest') : (this.user.id || ''),
            userEmail: '',
            userName: this.isGuest ? this.guestName.trim() : (this.userDetails?.fullName || ''),
            userPhone: this.isGuest ? this.guestPhone.trim() : (this.userDetails?.phone || this.deliveryAddress().contact || ''),
            orderItems,
            subtotal: this.orderData.subtotal || 0,
            deliveryCharge: this.deliveryCharge() || 0,
            totalAmount: this.orderTotal(),
            paymentMethod: this.paymentMethod || 'Cash on Delivery',
            orderStatus: 'Pending',
            companyID: this.siteId,
            discountToken: this.discountToken(),
            discountType: this.discountType(),
            discountValue: this.discountValue(),
            discountAmount: this.discountAmount(),
            area: this.deliveryAddress().area || '',
            shippingAddress: {
                district: this.deliveryAddress().district || '',
                city: this.deliveryAddress().city || '',
                street: this.deliveryAddress().street || '',
                contact: this.deliveryAddress().contact || '',
                type: this.deliveryAddress().type || '',
                area: this.deliveryAddress().area || '',
            },
            orderDate: new Date().toISOString()
        };

        this.orderService.add(order).subscribe({
            next: (response) => {
                if (this.isGuest) {
                    this.cartService.clearLocalCart();
                } else {
                    this.cartService.clearCart(this.user.id);
                }
                this.cartService.refreshCartCount();
                this.toast.success('Order placed successfully!', 'top-right', 3000);
                this.router.navigate(['/order-confirmation'], {
                    state: {
                        orderId: response?.id,
                        discountToken: this.discountToken(),
                        discountType: this.discountType(),
                        discountValue: this.discountValue(),
                        discountAmount: this.discountAmount(),
                    }
                });
            },
            error: (error) => {
                this.toast.danger(error?.error || 'Failed to place order. Please try again.', 'top-right', 3000);
                this.error.set(error?.error || 'Failed to place order. Please try again.');
                this.placingOrder.set(false);
            }
        });
    }

}
