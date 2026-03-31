import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SCustomer } from '../../../services/s-customer';
import { SData } from '../../../services/s-data';
import { SToast } from '../../../utils/toast/toast.service';
import { environment } from '../../../../environments/environment';
import { CustomerM } from '../../../models/Customer';
import { form, FormField, required, validate, debounce } from '@angular/forms/signals';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-customer-register',
  imports: [FormsModule, RouterLink, FormField, FontAwesomeModule],
  templateUrl: './customer-register.html',
  styleUrl: './customer-register.css',
})
export class CustomerRegister {
  private customerService = inject(SCustomer);
  private dataService = inject(SData);
  private toast = inject(SToast);
  private router = inject(Router);

  faEye = faEye;
  faEyeSlash = faEyeSlash;

  loading = signal(false);
  showPassword = signal(false);
  regions = signal<any[]>([]);
  cities = signal<any[]>([]);
  areas = signal<any[]>([]);

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
  });

  /* ---------------- SIGNAL FORM ---------------- */
  form = form(this.model, (schemaPath) => {
    required(schemaPath.fullName, { message: 'Full name is required' });
    required(schemaPath.phone, { message: 'Phone number is required' });
    required(schemaPath.pass, { message: 'Password is required' });
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

  ngOnInit(): void {
    this.dataService.getRegions().subscribe(regions => this.regions.set(regions));
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
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

  onSubmit(event: Event): void {
    event.preventDefault();

    if (!this.form().valid()) {
      this.toast.warning('Please fill all required fields correctly!', 'top-right', 3000);
      return;
    }

    this.loading.set(true);
    const formValue = this.form().value();
    const payload: CustomerM = {
      companyID: environment.companyCode,
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

    this.customerService.add(payload).subscribe({
      next: () => {
        this.toast.success('Account created successfully!', 'top-right', 3000);
        this.loading.set(false);
        this.formReset();
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.loading.set(false);
        this.toast.danger(
          error?.error || 'Registration failed. Please try again.',
          'top-right',
          4000
        );
      }
    });
  }

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
    });
    this.form().reset();
  }
}
