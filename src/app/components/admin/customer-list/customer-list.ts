import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPencil, faXmark, faMagnifyingGlass, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { FormsModule } from '@angular/forms';
import { SCustomer } from '../../../services/s-customer';
import { debounce, form, FormField, required, validate } from '@angular/forms/signals';
import { environment } from '../../../../environments/environment.production';
import { SPermission } from '../../../services/s-permission';
import { SToast } from '../../../utils/toast/toast.service';
import { SConfirm } from '../../../utils/confirm/confirm.service';
import { CustomerM } from '../../../models/Customer';

@Component({
    selector: 'app-customer-list',
    imports: [CommonModule, FontAwesomeModule, FormField, FormsModule],
    templateUrl: './customer-list.html',
    styleUrl: './customer-list.css',
})
export class CustomerList {
    faPencil = faPencil;
    faXmark = faXmark;
    faMagnifyingGlass = faMagnifyingGlass;
    faEye = faEye;
    faEyeSlash = faEyeSlash;

    /* ---------------- DI ---------------- */
    private customerService = inject(SCustomer);
    private permissionService = inject(SPermission);
    private toast = inject(SToast);
    private confirm = inject(SConfirm);

    @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

    /* ---------------- SIGNAL STATE ---------------- */
    items = signal<CustomerM[]>([]);
    searchQuery = signal('');
    showPassword = signal(false);

    toggleShowPassword() {
        this.showPassword.update(v => !v);
    }

    filteredList = computed(() => {
        const query = this.searchQuery().toLowerCase();

        return this.items()
            .filter(item =>
                item.fullName?.toLowerCase().includes(query) ||
                item.phone?.toLowerCase().includes(query) ||
                item.dist?.toLowerCase().includes(query)
            );
    });

    selected = signal<CustomerM | null>(null);

    isLoading = signal(false);
    hasError = signal(false);

    isView = signal(false);
    isInsert = signal(false);
    isEdit = signal(false);
    isDelete = signal(false);
    showList = signal(true);

    isSubmitted = signal(false);

    /* ---------------- FORM MODEL ---------------- */
    model = signal({
        fullName: '',
        phone: '',
        pass: '',
        dist: '',
        address: '',
        shippingDistrict: '',
        shippingCity: '',
        shippingStreet: '',
        shippingContact: '',
        shippingType: '',
        area: '',
        companyID: environment.companyCode.toString(),
    });

    /* ---------------- SIGNAL FORM ---------------- */
    form = form(this.model, (schemaPath) => {
        required(schemaPath.fullName, { message: 'Full name is required' });
        required(schemaPath.phone, { message: 'Phone number is required' });
        required(schemaPath.pass, { message: 'Password is required' });

        validate(schemaPath.phone, ({ value }) => {
            if (value() && !/^\d{10,15}$/.test(value())) {
                return { kind: 'complexity', message: 'Phone must be 10-15 digits' };
            }
            return null;
        });

        validate(schemaPath.pass, ({ value }) => {
            if (value() && value().length < 6) {
                return { kind: 'minLength', message: 'Password must be at least 6 characters' };
            }
            if (value() && value().length > 25) {
                return { kind: 'maxLength', message: 'Password must be less than 25 characters' };
            }
            if (value() && !/[A-Z]/.test(value())) {
                return { kind: 'complexity', message: 'Password must contain at least one uppercase letter' };
            }
            if (value() && !/[a-z]/.test(value())) {
                return { kind: 'complexity', message: 'Password must contain at least one lowercase letter' };
            }
            if (value() && !/[0-9]/.test(value())) {
                return { kind: 'complexity', message: 'Password must contain at least one number' };
            }
            if (value() && !/[!@#$%^&*(),.?":{}|<>]/.test(value())) {
                return { kind: 'complexity', message: 'Password must contain at least one special character' };
            }
            return null;
        });

        debounce(schemaPath.fullName, 300);
        debounce(schemaPath.phone, 300);
        debounce(schemaPath.pass, 300);
    });

    /* ---------------- LIFECYCLE ---------------- */
    ngOnInit(): void {
        this.loadItems();
        this.loadPermissions();
    }

    /* ---------------- LOADERS ---------------- */
    loadPermissions() {
        this.isView.set(this.permissionService.hasPermission('Customers', 'view'));
        this.isInsert.set(this.permissionService.hasPermission('Customers', 'create'));
        this.isEdit.set(this.permissionService.hasPermission('Customers', 'edit'));
        this.isDelete.set(this.permissionService.hasPermission('Customers', 'delete'));
    }

    loadItems() {
        this.isLoading.set(true);
        this.hasError.set(false);

        this.customerService.search().subscribe({
            next: (data) => {
                this.items.set(data);
                this.isLoading.set(false);
            },
            error: () => {
                this.hasError.set(true);
                this.isLoading.set(false);
            }
        });
    }

    /* ---------------- SEARCH ---------------- */
    onSearch(event: Event) {
        this.searchQuery.set((event.target as HTMLInputElement).value.trim());
    }

    /* ---------------- SUBMIT ---------------- */
    onSubmit(event: Event) {
        event.preventDefault();

        if (!this.form().valid()) {
            this.toast.warning('Form is Invalid!', 'bottom-right', 5000);
            return;
        }

        this.isSubmitted.set(true);

        const formValue = this.form().value();

        const payload: CustomerM = {
            companyID: Number(formValue.companyID),
            fullName: formValue.fullName,
            phone: formValue.phone,
            pass: formValue.pass,
            dist: formValue.dist,
            address: formValue.address,
            shippingDistrict: formValue.shippingDistrict,
            shippingCity: formValue.shippingCity,
            shippingStreet: formValue.shippingStreet,
            shippingContact: formValue.shippingContact,
            shippingType: formValue.shippingType,
            area: formValue.area,
        };

        const request$ = this.selected()
            ? this.customerService.update(this.selected()!.id!, payload)
            : this.customerService.add(payload);

        request$.subscribe({
            next: () => {
                this.loadItems();
                this.onToggleList();
                this.toast.success('Saved successfully!', 'bottom-right', 5000);
            },
            error: (error) => {
                this.isSubmitted.set(false);
                console.error('Error:', error);
                this.toast.danger(error?.error || 'Save unsuccessful!', 'top-left', 3000);
            }
        });
    }

    /* ---------------- UPDATE ---------------- */
    onUpdate(item: CustomerM) {
        this.selected.set(item);

        this.model.update(current => ({
            ...current,
            fullName: item.fullName ?? '',
            phone: item.phone ?? '',
            pass: item.pass ?? '',
            dist: item.dist ?? '',
            address: item.address ?? '',
            shippingDistrict: item.shippingDistrict ?? '',
            shippingCity: item.shippingCity ?? '',
            shippingStreet: item.shippingStreet ?? '',
            shippingContact: item.shippingContact ?? '',
            shippingType: item.shippingType ?? '',
            area: item.area ?? '',
            companyID: item.companyID.toString(),
        }));

        this.form().reset();
        this.showList.set(false);
    }

    /* ---------------- DELETE ---------------- */
    async onDelete(id: any) {
        const ok = await this.confirm.confirm({
            message: 'Are you sure you want to delete this customer?',
            confirmText: "Yes, I'm sure",
            cancelText: 'No, cancel',
            variant: 'danger',
        });

        if (ok) {
            this.customerService.delete(id).subscribe({
                next: () => {
                    this.items.update(list => list.filter(i => i.id !== id));
                    this.toast.success('Customer deleted successfully!', 'bottom-right', 5000);
                },
                error: (error) => {
                    this.toast.danger(error?.error || 'Customer delete unsuccessful!', 'top-left', 3000);
                    console.error('Error deleting customer:', error);
                }
            });
        }
    }

    /* ---------------- RESET ---------------- */
    formReset() {
        this.model.set({
            fullName: '',
            phone: '',
            pass: '',
            dist: '',
            address: '',
            shippingDistrict: '',
            shippingCity: '',
            shippingStreet: '',
            shippingContact: '',
            shippingType: '',
            area: '',
            companyID: environment.companyCode.toString(),
        });

        this.selected.set(null);
        this.isSubmitted.set(false);
        this.form().reset();
    }

    onToggleList() {
        this.showList.update(s => !s);
        this.formReset();
    }
}
