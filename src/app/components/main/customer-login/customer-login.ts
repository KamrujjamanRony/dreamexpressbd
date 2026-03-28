import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SCustomer } from '../../../services/s-customer';
import { SAuthCookie } from '../../../services/s-auth-cookie';
import { SToast } from '../../../utils/toast/toast.service';
import { SCart } from '../../../services/s-cart';
import { SWishlist } from '../../../services/s-wishlist';
import { form, FormField, required, validate, debounce } from '@angular/forms/signals';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-customer-login',
  imports: [FormsModule, RouterLink, FormField, FontAwesomeModule],
  templateUrl: './customer-login.html',
  styleUrl: './customer-login.css',
})
export class CustomerLogin {
  private customerService = inject(SCustomer);
  private authCookie = inject(SAuthCookie);
  private toast = inject(SToast);
  private cartService = inject(SCart);
  private wishlistService = inject(SWishlist);
  private router = inject(Router);

  faEye = faEye;
  faEyeSlash = faEyeSlash;

  loading = signal(false);
  showPassword = signal(false);

  /* ---------------- FORM MODEL ---------------- */
  model = signal({
    phone: '',
    password: '',
  });

  /* ---------------- SIGNAL FORM ---------------- */
  form = form(this.model, (schemaPath) => {
    required(schemaPath.phone, { message: 'Phone number is required' });
    required(schemaPath.password, { message: 'Password is required' });

    validate(schemaPath.phone, ({ value }) => {
      if (value() && !/^\d{10,15}$/.test(value())) {
        return { kind: 'complexity', message: 'Phone must be 10-15 digits' };
      }
      return null;
    });

    validate(schemaPath.password, ({ value }) => {
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

    debounce(schemaPath.phone, 300);
    debounce(schemaPath.password, 300);
  });

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  onSubmit(event: Event): void {
    event.preventDefault();

    if (!this.form().valid()) {
      this.toast.warning('Please fill all required fields!', 'top-right', 3000);
      return;
    }

    this.loading.set(true);
    const formValue = this.form().value();
    this.customerService.login(formValue.phone, formValue.password)
      .subscribe({
        next: (response: any) => {
          console.log('Customer login response:', response);
          this.authCookie.login(response);
          // Merge guest cart and wishlist into customer's account
          if (response?.id) {
            this.cartService.mergeGuestCart(response.id);
            this.wishlistService.mergeGuestWishlist(response.id.toString());
          }
          this.toast.success('Login successful!', 'top-right', 3000);
          this.loading.set(false);
          this.formReset();
          this.router.navigate(['/account/profile']);
        },
        error: (error) => {
          this.loading.set(false);
          this.toast.danger(
            error?.error?.message || 'Invalid phone or password!',
            'top-right',
            4000
          );
        }
      });
  }

  formReset() {
    this.model.set({ phone: '', password: '' });
    this.form().reset();
  }
}
