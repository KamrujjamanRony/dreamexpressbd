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
    });

    form = form(this.model, (schemaPath) => {
        required(schemaPath.fullName, { message: 'Full name is required' });
        required(schemaPath.phone, { message: 'Phone number is required' });
        required(schemaPath.dist, { message: 'Division is required' });
        required(schemaPath.address, { message: 'Address is required' });

        validate(schemaPath.fullName, ({ value }) => {
            if (value() && value().length < 2) {
                return { kind: 'minLength', message: 'Full name must be at least 2 characters' };
            }
            return null;
        });

        validate(schemaPath.phone, ({ value }) => {
            if (value() && !/^\d{10,15}$/.test(value())) {
                return { kind: 'complexity', message: 'Phone must be 10-15 digits' };
            }
            return null;
        });

        debounce(schemaPath.fullName, 300);
        debounce(schemaPath.phone, 300);
    });

    ngOnInit(): void {
        this.dataService.getRegions().subscribe(regions => this.regions.set(regions));
        this.loadProfile();
    }

    loadProfile(): void {
        const userData = this.authCookie.getUserData();
        if (userData?.id) {
            this.customerId.set(userData.id);
            this.model.set({
                companyID: String(environment.companyCode),
                fullName: userData.fullName || '',
                phone: userData.phone || '',
                pass: userData.pass || '',
                dist: userData.dist || '',
                address: userData.address || '',
                shippingDistrict: userData.shippingDistrict || userData.dist || '',
                shippingCity: userData.shippingCity || '',
                shippingStreet: userData.shippingStreet || userData.address || '',
                shippingContact: userData.shippingContact || userData.phone || '',
                shippingType: userData.shippingType || '',
                area: userData.area || '',
            });
            // Pre-load cities for the saved division
            if (userData.dist) {
                this.dataService.getCitiesByRegion(userData.dist).subscribe(cities => this.cities.set(cities));
            }
            // Pre-load shipping cities/areas
            const shippingDiv = userData.shippingDistrict || userData.dist || '';
            if (shippingDiv) {
                this.dataService.getCitiesByRegion(shippingDiv).subscribe(cities => this.shippingCities.set(cities));
            }
            if (userData.shippingCity) {
                this.dataService.getAreasByCity(userData.shippingCity).subscribe(areas => this.shippingAreas.set(areas));
            }
        }
    }

    toggleEdit(): void {
        this.editMode.update(v => !v);
    }

    onDistrictChange(division: string): void {
        this.model.update(m => ({ ...m, dist: division }));
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
        this.model.update(m => ({ ...m, shippingDistrict: division, shippingCity: '', area: '' }));
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

        this.customerService.update(this.customerId(), {
            ...formData,
            companyID: environment.companyCode,
        }).subscribe({
            next: (response) => {
                this.toast.success('Profile updated successfully!', 'top-right', 3000);
                // Update the cookie with new data
                this.authCookie.login({ ...response, id: this.customerId() });
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
