import { Component, inject, signal, afterNextRender, viewChild, ElementRef } from '@angular/core';
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
import { SGoogleAuth } from '../../../services/s-google-auth';
import { SFacebookAuth, FacebookUser } from '../../../services/s-facebook-auth';
import { SAuthCookie } from '../../../services/s-auth-cookie';
import { SCart } from '../../../services/s-cart';
import { SWishlist } from '../../../services/s-wishlist';

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
  private googleAuth = inject(SGoogleAuth);
  private facebookAuth = inject(SFacebookAuth);
  private authCookie = inject(SAuthCookie);
  private cartService = inject(SCart);
  private wishlistService = inject(SWishlist);

  faEye = faEye;
  faEyeSlash = faEyeSlash;

  loading = signal(false);
  showPassword = signal(false);
  googleLoading = signal(false);
  facebookLoading = signal(false);
  googleBtnEl = viewChild<ElementRef>('googleBtn');
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
    debounce(schemaPath.email, 300);
    debounce(schemaPath.shippingContact, 300);
    debounce(schemaPath.pass, 300);
  });

  ngOnInit(): void {
    this.dataService.getRegions().subscribe(regions => this.regions.set(regions));
  }

  constructor() {
    afterNextRender(() => {
      this.googleAuth.initialize((credential) => {
        this.handleGoogleLogin(credential);
      }).then((ready) => {
        if (ready) {
          const el = this.googleBtnEl()?.nativeElement;
          if (el) this.googleAuth.renderButton(el);
        }
      });
      this.facebookAuth.initialize();
    });
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
      this.toast.warning('Please fill all required fields correctly!', 'top-right', 3000);
      return;
    }

    const formValue = this.form().value();

    // At least one of email or phone is required
    if (!formValue.email?.trim() && !formValue.shippingContact?.trim()) {
      this.toast.warning('Please provide either email or phone number!', 'top-right', 3000);
      return;
    }

    this.loading.set(true);
    const district = formValue.shippingDistrict;
    const street = formValue.shippingStreet || formValue.address;

    const payload: CustomerM = {
      companyID: environment.companyCode,
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

  handleGoogleLogin(credential: string): void {
    const payload = this.decodeJwt(credential);
    if (!payload?.email) {
      this.toast.danger('Invalid Google credential!', 'top-right', 4000);
      return;
    }

    const email = payload.email;
    const pass = `G${payload.sub.slice(0, 6)}x1!a`;
    const socialData = {
      loginProvider: 'Google',
      providerKey: payload.sub,
      profileImage: payload.picture || '',
    };
    this.googleLoading.set(true);

    // Try login by email first (user may already exist)
    this.customerService.loginByEmail(email, pass).subscribe({
      next: (response: any) => this.onSocialSuccess(response, socialData),
      error: () => {
        // User doesn't exist — auto-register then login
        const registerPayload: CustomerM = {
          companyID: environment.companyCode,
          fullName: payload.name || email.split('@')[0],
          pass,
          email,
          ...socialData,
          address: '',
        };
        this.customerService.add(registerPayload).subscribe({
          next: () => {
            this.customerService.loginByEmail(email, pass).subscribe({
              next: (response: any) => this.onSocialSuccess(response, socialData),
              error: () => {
                this.googleLoading.set(false);
                this.toast.danger('Google sign-up failed!', 'top-right', 4000);
              },
            });
          },
          error: () => {
            this.googleLoading.set(false);
            this.toast.danger('Google sign-up failed!', 'top-right', 4000);
          },
        });
      },
    });
  }

  private onSocialSuccess(response: any, socialData: { loginProvider: string; providerKey: string; profileImage: string }): void {
    const merged = { ...response, ...socialData };
    this.authCookie.login(merged);
    if (response?.id) {
      this.customerService.update(response.id, {
        ...response,
        ...socialData,
        companyID: environment.companyCode,
      }).subscribe();
      this.cartService.mergeGuestCart(response.id);
      this.wishlistService.mergeGuestWishlist(response.id.toString());
    }
    this.toast.success('Login successful!', 'top-right', 3000);
    this.googleLoading.set(false);
    this.facebookLoading.set(false);
    this.router.navigate(['/account/profile']);
  }

  handleFacebookLogin(): void {
    this.facebookLoading.set(true);
    this.facebookAuth.login((user: FacebookUser | null) => {
      if (!user?.email) {
        this.facebookLoading.set(false);
        this.toast.danger('Facebook login failed! Email is required.', 'top-right', 4000);
        return;
      }

      const email = user.email;
      const pass = `F${user.id.slice(0, 6)}x1!a`;
      const socialData = {
        loginProvider: 'Facebook',
        providerKey: user.id,
        profileImage: user.picture?.data?.url || '',
      };

      this.customerService.loginByEmail(email, pass).subscribe({
        next: (response: any) => this.onSocialSuccess(response, socialData),
        error: () => {
          const registerPayload: CustomerM = {
            companyID: environment.companyCode,
            fullName: user.name || email.split('@')[0],
            pass,
            email,
            ...socialData,
            address: '',
          };
          this.customerService.add(registerPayload).subscribe({
            next: () => {
              this.customerService.loginByEmail(email, pass).subscribe({
                next: (response: any) => this.onSocialSuccess(response, socialData),
                error: () => {
                  this.facebookLoading.set(false);
                  this.toast.danger('Facebook sign-up failed!', 'top-right', 4000);
                },
              });
            },
            error: () => {
              this.facebookLoading.set(false);
              this.toast.danger('Facebook sign-up failed!', 'top-right', 4000);
            },
          });
        },
      });
    });
  }

  private decodeJwt(token: string): any {
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  }

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
    });
    this.form().reset();
  }
}
