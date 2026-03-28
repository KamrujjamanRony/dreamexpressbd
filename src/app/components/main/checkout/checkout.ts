import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BdtPipe } from '../../../pipes/bdt.pipe';
import { AddressModal } from '../../shared/address-modal/address-modal';
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

@Component({
    selector: 'app-checkout',
    imports: [FormsModule, BdtPipe, AddressModal],
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

    // Guest checkout fields
    guestName = '';
    guestPhone = '';
    guestDistrict = '';
    guestCity = '';
    guestStreet = '';

    // Discount token
    tokenCode = '';
    tokenError = '';
    tokenApplied = signal(false);
    tokenLoading = signal(false);
    discountToken = signal<string>('');
    discountType = signal<string>('');
    discountValue = signal<number>(0);
    discountAmount = signal<number>(0);

    // For address modal
    showAddressModal = false;
    addressModalEditMode = false;
    selectedAddressForEdit: any = null;

    // Animation state
    ready = signal(false);

    // Step tracking
    activeStep = signal(1);

    // Computed totals
    orderTotal = computed(() =>
        Math.max(0, (this.orderData?.subtotal || 0) + this.deliveryCharge() - this.discountAmount())
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

        setTimeout(() => this.ready.set(true), 50);
    }

    private calculateDeliveryCharge() {
        if (this.tokenApplied() && this.discountType() === 'FreeDelivery') {
            this.deliveryCharge.set(0);
            return;
        }

        const district = this.deliveryAddress()?.district || '';
        if (district.toLowerCase().includes('dhaka')) {
            this.deliveryCharge.set(60);
        } else if (district) {
            this.deliveryCharge.set(120);
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
                    this.deliveryCharge.set(0);
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
            error: () => {
                this.tokenError = 'Failed to validate token';
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
                this.userAddresses.set(Array.isArray(data?.[0]?.address) ? data[0].address : []);
                this.setDefaultAddress();
                this.loading.set(false);
                this.calculateDeliveryCharge();
            },
            error: () => {
                this.error.set('Failed to load user details');
                this.loading.set(false);
            }
        });
    }

    private setDefaultAddress() {
        const defaultAddress = this.userAddresses().find((addr: any) => addr.isDefault);
        if (defaultAddress) {
            this.deliveryAddress.set(defaultAddress);
            this.selectedAddressId.set(defaultAddress.id);
        } else if (this.userAddresses().length > 0) {
            this.deliveryAddress.set(this.userAddresses()[0]);
            this.selectedAddressId.set(this.userAddresses()[0].id);
        }
    }

    openAddressModal(isEditMode: boolean = false, address?: any) {
        this.addressModalEditMode = isEditMode;
        this.selectedAddressForEdit = address;
        this.showAddressModal = true;
    }

    handleAddressModalSubmit(result: any) {
        this.showAddressModal = false;
        this.loading.set(true);

        if (this.addressModalEditMode) {
            const updatedAddresses = this.userAddresses().map((addr: any) =>
                addr.id === result.id ? result : addr
            );
            this.updateUserAddresses(updatedAddresses, 'Address updated');
        } else {
            const newAddress = {
                ...result,
                id: crypto.randomUUID(),
                userId: this.user?.id
            };

            const updatedAddresses = [...this.userAddresses(), newAddress];

            if (newAddress.isDefault) {
                updatedAddresses.forEach((addr: any) => {
                    addr.isDefault = addr.id === newAddress.id;
                });
            }

            this.updateUserAddresses(updatedAddresses, 'Address added');

            if (updatedAddresses.length === 1 || newAddress.isDefault) {
                this.deliveryAddress.set(newAddress);
                this.selectedAddressId.set(newAddress.id);
                this.calculateDeliveryCharge();
            }
        }
    }

    private updateUserAddresses(addresses: any[], successMessage: string) {
        this.customerService.update(this.userDetails?.id, {
            ...this.userDetails,
            address: addresses
        }).subscribe({
            next: () => {
                this.userAddresses.set(addresses);
                this.toast.success(successMessage, 'top-right', 2000);
                this.loading.set(false);
            },
            error: () => {
                this.toast.danger('Failed to update address', 'top-right', 3000);
                this.loading.set(false);
            }
        });
    }

    selectAddress(addressId: string) {
        const selected = this.userAddresses().find((addr: any) => addr.id === addressId);
        if (selected) {
            this.deliveryAddress.set(selected);
            this.selectedAddressId.set(addressId);
            this.calculateDeliveryCharge();
        }
    }

    goToStep(step: number) {
        if (step === 2) {
            if (this.isGuest) {
                if (!this.guestName.trim() || !this.guestPhone.trim() || !this.guestDistrict.trim() || !this.guestCity.trim() || !this.guestStreet.trim()) {
                    this.toast.warning('Please fill in all delivery details', 'top-right', 2000);
                    return;
                }
                // Set delivery address from guest form
                this.deliveryAddress.set({
                    street: this.guestStreet.trim(),
                    city: this.guestCity.trim(),
                    district: this.guestDistrict.trim(),
                    contact: this.guestPhone.trim(),
                    type: 'Home',
                });
                this.calculateDeliveryCharge();
            } else if (!this.deliveryAddress()) {
                this.toast.warning('Please select a delivery address first', 'top-right', 2000);
                return;
            }
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
            shippingAddress: {
                district: this.deliveryAddress().district || '',
                city: this.deliveryAddress().city || '',
                street: this.deliveryAddress().street || '',
                contact: this.deliveryAddress().contact || '',
                type: this.deliveryAddress().type || '',
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
                    state: { orderId: response?.id }
                });
            },
            error: () => {
                this.toast.danger('Failed to place order. Please try again.', 'top-right', 3000);
                this.error.set('Failed to place order. Please try again.');
                this.placingOrder.set(false);
            }
        });
    }

}
