import { Component, inject, signal } from '@angular/core';
import { SCustomer } from '../../../services/s-customer';
import { SAuthCookie } from '../../../services/s-auth-cookie';
import { SData } from '../../../services/s-data';
import { SToast } from '../../../utils/toast/toast.service';
import { environment } from '../../../../environments/environment';
import { CustomerM } from '../../../models/Customer';
import { form, FormField, required, validate, debounce } from '@angular/forms/signals';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUser, faPhone, faMapPin, faLocationDot, faPencil, faTruck } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-profile',
    imports: [FormField, FontAwesomeModule],
    templateUrl: './profile.html',
    styleUrl: './profile.css',
})
export class Profile {
    private customerService = inject(SCustomer);
    private authCookie = inject(SAuthCookie);
    private dataService = inject(SData);
    private toast = inject(SToast);

    faUser = faUser;
    faPhone = faPhone;
    faMapPin = faMapPin;
    faLocationDot = faLocationDot;
    faPencil = faPencil;
    faTruck = faTruck;

    loading = signal(false);
    editMode = signal(false);
    isSocialLogin = signal(false);
    customerId = signal<any>(null);
    regions = signal<any[]>([]);
    cities = signal<any[]>([]);
    areas = signal<any[]>([]);
    shippingCities = signal<any[]>([]);
    shippingAreas = signal<any[]>([]);

    addressTypes = [
        { label: 'Home', value: 'Home' },
        { label: 'Work', value: 'Work' },
        { label: 'Other', value: 'Other' }
    ];

    model = signal({
        companyID: String(environment.companyCode),
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
    });

    form = form(this.model, (schemaPath) => {
        required(schemaPath.fullName, { message: 'Full name is required' });
        required(schemaPath.shippingDistrict, { message: 'Division is required' });

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

        debounce(schemaPath.fullName, 300);
    });

    ngOnInit(): void {
        this.dataService.getRegions().subscribe(regions => this.regions.set(regions));
        this.loadProfile();
    }

    loadProfile(): void {
        const userData = this.authCookie.getUserData();
        if (userData?.id) {
            this.customerId.set(userData.id);
            // Fetch fresh data from API
            this.customerService.search(userData.id).subscribe({
                next: (data) => {
                    const profile = data?.[0];
                    if (!profile) return;
                    // Detect social login from API data
                    this.isSocialLogin.set(!!(profile.loginProvider && profile.loginProvider !== 'Manual'));
                    // Update cookie with fresh data
                    this.authCookie.login({ ...userData, ...profile, id: userData.id });
                    this.model.set({
                        companyID: String(environment.companyCode),
                        fullName: profile.fullName || '',
                        email: profile.email || '',
                        pass: profile.pass || '',
                        address: profile.address || '',
                        shippingDistrict: profile.shippingDistrict || '',
                        shippingCity: profile.shippingCity || '',
                        shippingStreet: profile.shippingStreet || profile.address || '',
                        shippingContact: profile.shippingContact || '',
                        shippingType: profile.shippingType || '',
                        area: profile.area || '',
                    });
                    // Pre-load cities for the saved division
                    const div = profile.shippingDistrict || '';
                    if (div) {
                        this.dataService.getCitiesByRegion(div).subscribe(cities => this.shippingCities.set(cities));
                    }
                    if (profile.shippingCity) {
                        this.dataService.getAreasByCity(profile.shippingCity).subscribe(areas => this.shippingAreas.set(areas));
                    }
                },
            });
        }
    }

    toggleEdit(): void {
        this.editMode.update(v => !v);
    }

    onDistrictChange(division: string): void {
        this.cities.set([]);
        this.areas.set([]);
        if (division) {
            this.dataService.getCitiesByRegion(division).subscribe(cities => this.cities.set(cities));
        }
    }

    onCityChange(city: string): void {
        this.areas.set([]);
        if (city) {
            this.dataService.getAreasByCity(city).subscribe(areas => this.areas.set(areas));
        }
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

    onSubmit(event: Event): void {
        event.preventDefault();

        if (!this.form().valid()) {
            this.toast.warning('Please fill all required fields!', 'top-right', 3000);
            return;
        }

        this.loading.set(true);
        const formData = this.form().value();
        const userData = this.authCookie.getUserData();

        this.customerService.update(this.customerId(), {
            ...formData,
            address: formData.shippingStreet || formData.address,
            shippingDistrict: formData.shippingDistrict,
            shippingStreet: formData.shippingStreet || formData.address,
            shippingContact: formData.shippingContact,
            companyID: environment.companyCode,
            loginProvider: userData?.loginProvider || '',
            providerKey: userData?.providerKey || '',
            profileImage: userData?.profileImage || '',
        }).subscribe({
            next: (response) => {
                this.toast.success('Profile updated successfully!', 'top-right', 3000);
                // Update the cookie with new data
                this.authCookie.login({
                    ...response,
                    ...formData,
                    id: this.customerId(),
                    companyID: environment.companyCode,
                    address: formData.shippingStreet || formData.address,
                    shippingDistrict: formData.shippingDistrict,
                    shippingStreet: formData.shippingStreet || formData.address,
                    shippingContact: formData.shippingContact,
                    loginProvider: userData?.loginProvider || '',
                    providerKey: userData?.providerKey || '',
                    profileImage: userData?.profileImage || '',
                });
                this.editMode.set(false);
                this.loading.set(false);
            },
            error: (error) => {
                this.toast.warning(error?.error || 'Failed to update profile', 'top-right', 3000);
                this.loading.set(false);
            },
        });
    }
}
