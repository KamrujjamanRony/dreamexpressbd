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
import { SData } from '../../../services/s-data';

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
    private dataService = inject(SData);

    @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

    /* ---------------- SIGNAL STATE ---------------- */
    items = signal<CustomerM[]>([]);
    searchQuery = signal('');
    showPassword = signal(false);
    regions = signal<any[]>([]);
    shippingCities = signal<any[]>([]);
    shippingAreas = signal<any[]>([]);

    addressTypes = [
        { label: 'Home', value: 'Home' },
        { label: 'Work', value: 'Work' },
        { label: 'Other', value: 'Other' }
    ];

    toggleShowPassword() {
        this.showPassword.update(v => !v);
    }

    filteredList = computed(() => {
        const query = this.searchQuery().toLowerCase();

        return this.items()
            .filter(item =>
                item.fullName?.toLowerCase().includes(query) ||
                item.email?.toLowerCase().includes(query) ||
                item.shippingDistrict?.toLowerCase().includes(query)
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
        email: '',
        pass: '',
        address: '',
        shippingDistrict: '',
        shippingCity: '',
        shippingStreet: '',
        shippingContact: '',
        shippingType: '',
        area: '',
        loginProvider: '',
        companyID: environment.companyCode.toString(),
    });

    /* ---------------- SIGNAL FORM ---------------- */
    form = form(this.model, (schemaPath) => {
        required(schemaPath.fullName, { message: 'Full name is required' });
        required(schemaPath.pass, { message: 'Password is required' });
        required(schemaPath.shippingDistrict, { message: 'Division is required' });
        required(schemaPath.shippingStreet, { message: 'Address is required' });

        validate(schemaPath.fullName, ({ value }) => {
            if (value() && value().length < 2) {
                return { kind: 'minLength', message: 'Full name must be at least 2 characters' };
            }
            return null;
        });

        validate(schemaPath.email, ({ value }) => {
            if (value() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value())) {
                return { kind: 'complexity', message: 'Enter a valid email address' };
            }
            return null;
        });

        validate(schemaPath.shippingContact, ({ value }) => {
            if (value() && !/^\d{10,15}$/.test(value())) {
                return { kind: 'pattern', message: 'Phone must be 10-15 digits' };
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
        debounce(schemaPath.email, 300);
        debounce(schemaPath.pass, 300);
    });

    /* ---------------- LIFECYCLE ---------------- */
    ngOnInit(): void {
        this.loadItems();
        this.loadPermissions();
        this.dataService.getRegions().subscribe(regions => this.regions.set(regions));
    }

    onShippingDistrictChange(division: string): void {
        this.model.update(m => ({
            ...m,
            shippingDistrict: division,
            shippingCity: '',
            area: ''
        }));
        this.shippingCities.set([]);
        this.shippingAreas.set([]);
        if (division) {
            this.dataService.getCitiesByRegion(division).subscribe(cities => this.shippingCities.set(cities));
        }
    }

    onShippingCityChange(city: string): void {
        this.model.update(m => ({ ...m, shippingCity: city, area: '' }));
        this.shippingAreas.set([]);
        if (city) {
            this.dataService.getAreasByCity(city).subscribe(areas => this.shippingAreas.set(areas));
        }
    }

    onShippingAreaChange(area: string): void {
        this.model.update(m => ({ ...m, area }));
    }

    onShippingStreetChange(street: string): void {
        this.model.update(m => ({ ...m, address: street, shippingStreet: street }));
    }

    onShippingTypeChange(type: string): void {
        this.model.update(m => ({ ...m, shippingType: type }));
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

        const formValue = this.form().value();
        if (!formValue.email?.trim() && !formValue.shippingContact?.trim()) {
            this.toast.warning('Please provide either Email or Phone!', 'bottom-right', 5000);
            return;
        }

        this.isSubmitted.set(true);

        const district = formValue.shippingDistrict;
        const street = formValue.shippingStreet || formValue.address;

        const payload: CustomerM = {
            companyID: Number(formValue.companyID),
            fullName: formValue.fullName,
            email: formValue.email,
            pass: formValue.pass,
            address: street,
            shippingDistrict: district,
            shippingCity: formValue.shippingCity,
            shippingStreet: street,
            shippingContact: formValue.shippingContact,
            shippingType: formValue.shippingType,
            area: formValue.area,
            loginProvider: formValue.loginProvider,
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
            email: item.email ?? '',
            pass: item.pass ?? '',
            address: item.address ?? '',
            shippingDistrict: item.shippingDistrict ?? '',
            shippingCity: item.shippingCity ?? '',
            shippingStreet: item.shippingStreet ?? '',
            shippingContact: item.shippingContact ?? '',
            shippingType: item.shippingType ?? '',
            area: item.area ?? '',
            loginProvider: item.loginProvider ?? '',
            companyID: item.companyID.toString(),
        }));

        this.form().reset();

        if (item.shippingDistrict) {
            this.dataService.getCitiesByRegion(item.shippingDistrict).subscribe(cities => this.shippingCities.set(cities));
        } else {
            this.shippingCities.set([]);
        }

        if (item.shippingCity) {
            this.dataService.getAreasByCity(item.shippingCity).subscribe(areas => this.shippingAreas.set(areas));
        } else {
            this.shippingAreas.set([]);
        }

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
            email: '',
            pass: '',
            address: '',
            shippingDistrict: '',
            shippingCity: '',
            shippingStreet: '',
            shippingContact: '',
            shippingType: '',
            area: '',
            loginProvider: '',
            companyID: environment.companyCode.toString(),
        });

        this.selected.set(null);
        this.isSubmitted.set(false);
        this.shippingCities.set([]);
        this.shippingAreas.set([]);
        this.form().reset();
    }

    onToggleList() {
        this.showList.update(s => !s);
        this.formReset();
    }
}
