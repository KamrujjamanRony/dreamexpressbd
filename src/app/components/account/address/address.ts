import { Component, inject, signal } from '@angular/core';
import { Profile } from '../profile/profile';
import { ModalAddress } from '../../shared/modal-address/modal-address';
import { SCustomer } from '../../../services/s-customer';
import { ProfileCard } from "../../shared/profile-card/profile-card";

@Component({
  selector: 'app-address',
  imports: [ModalAddress, ProfileCard],
  templateUrl: './address.html',
  styleUrl: './address.css',
})
export class Address {
  private usersService = inject(SCustomer);
  // private auth = inject(Auth);

  userId: string | null = null;
  userData = signal<any>({});
  address = signal<any[]>([]);
  loading = signal<boolean>(false);
  showModal = signal<boolean>(false);
  selectedId = signal<any>(null);
  selectedAddress = signal<any>(null);
  isEditMode = signal<boolean>(false);

  // ngOnInit() {
  //   this.auth.onAuthStateChanged((user) => {
  //     this.userId = user?.uid ?? null;
  //     if (this.userId) {
  //       this.fetchUser();
  //     }
  //   });
  // }

  fetchUser() {
    this.loading.set(true);
    this.usersService.get(this.userId!).subscribe({
      next: (data) => {
        this.userData.set(data);
        this.selectedId.set(data.id);
        this.address.set(data?.address || []);
        this.loading.set(false);
      },
      error: (error) => {
        // this.toastService.showMessage('error', 'Error', 'Failed to fetch user data');
        console.error('Error fetching user:', error);
        this.loading.set(false);
      }
    });
  }

  openAddModal() {
    this.isEditMode.set(false);
    this.selectedAddress.set(null);
    this.showModal.set(true);
  }

  openEditModal(address: any) {
    this.isEditMode.set(true);
    this.selectedAddress.set(address);
    this.showModal.set(true);
  }

  handleModalSubmit(addressData: any) {
    if (this.isEditMode()) {
      this.updateAddress(addressData);
    } else {
      this.addAddress(addressData);
    }
    this.showModal.set(false);
  }

  addAddress(newAddress: any) {
    this.loading.set(true);

    // If new address is set as default, unset all others
    let updatedAddresses = [...this.address(), {
      ...newAddress,
      id: crypto.randomUUID(),
      userId: this.userId
    }];

    if (newAddress.isDefault) {
      updatedAddresses = updatedAddresses.map(address => ({
        ...address,
        isDefault: address.id === newAddress.id
      }));
    }

    this.updateUserAddresses(updatedAddresses, 'Address added successfully');
  }

  updateAddress(updatedAddress: any) {
    this.loading.set(true);
    const updatedAddresses = this.address().map(address =>
      address.id === updatedAddress.id ? updatedAddress : address
    );
    this.updateUserAddresses(updatedAddresses, 'Address updated successfully');
  }

  deleteAddress(addressId: string) {
    const addressToDelete = this.address().find(a => a.id === addressId);

    // Prevent deleting default address
    if (addressToDelete?.isDefault) {
      // this.toastService.showMessage('error', 'Error', 'Cannot delete default address');
      return;
    }

    this.loading.set(true);
    const updatedAddresses = this.address().filter(address => address.id !== addressId);

    this.usersService.update(this.selectedId()!, {
      ...this.userData(),
      address: updatedAddresses
    }).subscribe({
      next: () => {
        this.address.set(updatedAddresses);
        // this.toastService.showMessage('success', 'Success', 'Address deleted');
        this.loading.set(false);
      },
      error: (error) => {
        // this.toastService.showMessage('error', 'Error', 'Failed to delete address');
        console.error('Error:', error);
        this.loading.set(false);
      }
    });
  }

  setDefaultAddress(addressId: string) {
    this.loading.set(true);

    // Update all addresses - set only the selected one as default
    const updatedAddresses = this.address().map(address => ({
      ...address,
      isDefault: address.id === addressId
    }));

    this.usersService.update(this.selectedId()!, {
      ...this.userData(),
      address: updatedAddresses
    }).subscribe({
      next: () => {
        this.address.set(updatedAddresses);
        // this.toastService.showMessage('success', 'Success', 'Default address updated');
        this.loading.set(false);
      },
      error: (error) => {
        // this.toastService.showMessage('error', 'Error', 'Failed to update default address');
        console.error('Error:', error);
        this.loading.set(false);
      }
    });
  }

  private updateUserAddresses(addresses: any[], successMessage: string) {
    this.usersService.update(this.selectedId()!, {
      ...this.userData(),
      address: addresses
    }).subscribe({
      next: () => {
        this.address.set(addresses);
        // this.toastService.showMessage('success', 'Success', successMessage);
        this.loading.set(false);
      },
      error: (error) => {
        // this.toastService.showMessage('error', 'Error', error.error?.message || 'Operation failed');
        console.error('Error:', error);
        this.loading.set(false);
      }
    });
  }


  closeModal() {
    this.showModal.set(false);
  }

}
