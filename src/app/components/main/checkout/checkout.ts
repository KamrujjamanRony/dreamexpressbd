import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BdtPipe } from '../../../pipes/bdt.pipe';
import { AddressModal } from '../../shared/address-modal/address-modal';
import { Router } from '@angular/router';
import { SCart } from '../../../services/s-cart';
import { SOrder } from '../../../services/s-order';
import { SCustomer } from '../../../services/s-customer';
import { SSetting } from '../../../services/s-setting';
import { SToken } from '../../../services/s-token';
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
    private usersService = inject(SCustomer);
    private siteSettingService = inject(SSetting);
    private tokenService = inject(SToken);
    siteId = environment.companyCode;
    orderData: any;
    user: any;
    userDetails: any;
    loading = false;
    error: string | null = null;
    paymentMethod: string = 'Cash on Delivery';
    deliveryCharge = signal<number>(0);
    deliveryAddress = signal<any>(null);
    userAddresses = signal<any[]>([]);
    selectedAddressId = signal<string | null>(null);

    // Discount token
    tokenCode = '';
    tokenError = '';
    tokenApplied = signal(false);
    tokenLoading = false;
    discountToken = signal<string>('');
    discountType = signal<string>('');
    discountValue = signal<number>(0);
    discountAmount = signal<number>(0);

    // For address modal
    showAddressModal = false;
    addressModalEditMode = false;
    selectedAddressForEdit: any = null;

    constructor() {
        const navigation = this.router.currentNavigation();
        this.orderData = navigation?.extras.state?.['orderData'] ||
            history.state?.orderData;
    }

    ngOnInit() {
        // this.auth.onAuthStateChanged((user) => {
        //     this.user = user;
        //     if (user) {
        //         this.loadUserDetails(user.uid);
        //     }
        // });
    }

    private calculateDeliveryCharge() {
        if (this.tokenApplied() && this.discountType() === 'FreeDelivery') {
            this.deliveryCharge.set(0);
            return;
        }

        const district = this.deliveryAddress()?.district || '';
        if (district.toLowerCase().includes('dhaka')) {
            this.deliveryCharge.set(60); // Inside Dhaka
        } else {
            this.deliveryCharge.set(120); // Outside Dhaka
        }
    }

    applyToken() {
        const code = this.tokenCode.trim();
        if (!code) {
            this.tokenError = 'Please enter a token code';
            return;
        }

        this.tokenLoading = true;
        this.tokenError = '';

        this.tokenService.search().subscribe({
            next: (tokens: TokenM[]) => {
                const token = tokens.find(t =>
                    t.code.toLowerCase() === code.toLowerCase() && t.isActive && t.usedCount < t.maxUseCount
                );

                if (!token) {
                    this.tokenError = 'Invalid or expired token';
                    this.tokenLoading = false;
                    return;
                }

                const now = new Date();
                if (new Date(token.expireAt) < now) {
                    this.tokenError = 'This token has expired';
                    this.tokenLoading = false;
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
                    const amount = Math.round((subtotal * token.value) / 100);
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
                this.tokenLoading = false;
            },
            error: () => {
                this.tokenError = 'Failed to validate token';
                this.tokenLoading = false;
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

    getOrderTotal(): number {
        return (this.orderData?.subtotal || 0) + this.deliveryCharge() - this.discountAmount();
    }

    loadUserDetails(userId: string) {
        this.loading = true;
        this.usersService.get(userId).subscribe({
            next: (data) => {
                this.userDetails = data;
                this.userAddresses.set(Array.isArray(data.address) ? data.address : []);
                this.setDefaultAddress();
                this.loading = false;
                this.calculateDeliveryCharge();
            },
            error: (err) => {
                console.error('Failed to load user details:', err);
                this.error = 'Failed to load user details';
                this.loading = false;
            }
        });
    }

    private setDefaultAddress() {
        const defaultAddress = this.userAddresses().find(addr => addr.isDefault);
        if (defaultAddress) {
            this.deliveryAddress.set(defaultAddress);
            this.selectedAddressId.set(defaultAddress.id);
        } else if (this.userAddresses().length > 0) {
            this.deliveryAddress.set(this.userAddresses()[0]);
            this.selectedAddressId?.set(this.userAddresses()[0].id);
        }
    }

    openAddressModal(isEditMode: boolean = false, address?: any) {
        this.addressModalEditMode = isEditMode;
        this.selectedAddressForEdit = address;
        this.showAddressModal = true;
    }

    handleAddressModalSubmit(result: any) {
        this.showAddressModal = false;
        this.loading = true;

        if (this.addressModalEditMode) {
            // Update existing address
            const updatedAddresses = this.userAddresses().map(addr =>
                addr.id === result.id ? result : addr
            );
            this.updateUserAddresses(updatedAddresses, 'Address updated successfully');
        } else {
            // Add new address
            const newAddress = {
                ...result,
                id: crypto.randomUUID(),
                userId: this.user?.uid
            };

            const updatedAddresses = [...this.userAddresses(), newAddress];

            // If new address is default, unset others
            if (newAddress.isDefault) {
                updatedAddresses.forEach(addr => {
                    addr.isDefault = addr.id === newAddress.id;
                });
            }

            this.updateUserAddresses(updatedAddresses, 'Address added successfully');

            // Select the new address if it's the only one or is default
            if (updatedAddresses.length === 1 || newAddress.isDefault) {
                this.deliveryAddress.set(newAddress);
                this.selectedAddressId.set(newAddress.id);
                this.calculateDeliveryCharge(); // Add this line
            }
        }
    }

    private updateUserAddresses(addresses: any[], successMessage: string) {
        this.usersService.update(this.userDetails?.id, {
            ...this.userDetails,
            address: addresses
        }).subscribe({
            next: () => {
                this.userAddresses.set(addresses);
                // this.toastService.showMessage('success', 'Success', successMessage);
                this.loading = false;
            },
            error: (error) => {
                // this.toastService.showMessage('error', 'Error', 'Failed to update address');
                console.error('Error:', error);
                this.loading = false;
            }
        });
    }

    selectAddress(addressId: string) {
        const selected = this.userAddresses().find(addr => addr.id === addressId);
        if (selected) {
            this.deliveryAddress.set(selected);
            this.selectedAddressId.set(addressId);
            this.calculateDeliveryCharge(); // Add this line
        }
    }

    async placeOrder() {
        if (!this.user) {
            this.error = 'Please login to place an order';
            return;
        }

        if (!this.deliveryAddress()) {
            this.error = 'Please select a delivery address';
            return;
        }

        if (!this.orderData?.products?.length) {
            this.error = 'No products in cart';
            return;
        }

        this.loading = true;
        this.error = null;

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
            userId: this.user.uid || '',
            userEmail: this.user.email || '',
            userName: this.userDetails?.fullname || '',
            userPhone: this.deliveryAddress().contact || '',
            orderItems,
            subtotal: this.orderData.subtotal || 0,
            deliveryCharge: this.deliveryCharge() || 0,
            totalAmount: this.getOrderTotal(),
            paymentMethod: this.paymentMethod || 'Cash on Delivery',
            orderStatus: 'Pending',
            companyID: this.siteId,
            discountToken: this.discountToken(),
            discountType: this.discountType(),
            discountValue: this.discountValue(),
            discountAmount: this.discountAmount(),
            shippingAddress: {
                // id: this.deliveryAddress().id,
                district: this.deliveryAddress().district || '',
                city: this.deliveryAddress().city || '',
                street: this.deliveryAddress().street || '',
                contact: this.deliveryAddress().contact || '',
                type: this.deliveryAddress().type || '',
                // isDefault: this.deliveryAddress().isDefault
            },
            orderDate: new Date().toISOString()
        };

        try {
            const response = await this.orderService.add(order).toPromise();
            await this.cartService.clearCart(this.user.uid);
            this.router.navigate(['/order-confirmation'], {
                state: { orderId: response?.id }
            });
        } catch (err) {
            console.error('Order failed:', err);
            // this.toastService.showMessage('error', 'Error', 'Failed to place order');
            this.error = 'Failed to place order. Please try again.';
        } finally {
            this.loading = false;
        }
    }

}
