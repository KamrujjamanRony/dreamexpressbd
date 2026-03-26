import { Component, inject, signal } from '@angular/core';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SCustomer } from '../../../services/s-customer';
import { SAuthCookie } from '../../../services/s-auth-cookie';
import { SToast } from '../../../utils/toast/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-customer-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './customer-login.html',
  styleUrl: './customer-login.css',
})
export class CustomerLogin {
  private customerService = inject(SCustomer);
  private authCookie = inject(SAuthCookie);
  private toast = inject(SToast);
  private loginSubscription?: Subscription;
  private router = inject(Router);
  fb = inject(NonNullableFormBuilder);

  isSubmitted = false;
  loading = signal(false);
  showPassword = signal(false);

  form = this.fb.group({
    phone: ['', [Validators.required, Validators.pattern(/^\d{10,15}$/)]],
    password: ['', Validators.required],
  });

  getControl(controlName: string): FormControl {
    return this.form.get(controlName) as FormControl;
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  onSubmit(): void {
    this.isSubmitted = true;
    if (this.form.valid) {
      this.loading.set(true);
      const { phone, password } = this.form.getRawValue();
      this.loginSubscription = this.customerService.login(phone, password)
        .subscribe({
          next: (response: any) => {
            this.authCookie.login(response);
            this.toast.success('Login successful!', 'top-right', 3000);
            this.loading.set(false);
            this.form.reset();
            this.isSubmitted = false;
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
    } else {
      this.toast.warning('Please fill all required fields!', 'top-right', 3000);
    }
  }

  ngOnDestroy(): void {
    this.loginSubscription?.unsubscribe();
  }
}
