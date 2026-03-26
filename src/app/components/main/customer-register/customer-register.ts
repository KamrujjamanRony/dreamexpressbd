import { Component, inject, signal } from '@angular/core';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SCustomer } from '../../../services/s-customer';
import { SToast } from '../../../utils/toast/toast.service';
import { environment } from '../../../../environments/environment';
import { CustomerM } from '../../../models/Customer';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-customer-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './customer-register.html',
  styleUrl: './customer-register.css',
})
export class CustomerRegister {
  private customerService = inject(SCustomer);
  private toast = inject(SToast);
  private router = inject(Router);
  private subscription?: Subscription;
  fb = inject(NonNullableFormBuilder);

  isSubmitted = false;
  loading = signal(false);
  showPassword = signal(false);

  form = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.pattern(/^\d{10,15}$/)]],
    pass: ['', [Validators.required, Validators.minLength(3)]],
    dist: ['', Validators.required],
    address: ['', Validators.required],
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
      const formValue = this.form.getRawValue();
      const payload: CustomerM = {
        companyID: environment.companyCode,
        fullName: formValue.fullName,
        phone: formValue.phone,
        pass: formValue.pass,
        dist: formValue.dist,
        address: formValue.address,
      };

      this.subscription = this.customerService.add(payload).subscribe({
        next: () => {
          this.toast.success('Account created successfully!', 'top-right', 3000);
          this.loading.set(false);
          this.form.reset();
          this.isSubmitted = false;
          this.router.navigate(['/login']);
        },
        error: (error) => {
          this.loading.set(false);
          this.toast.danger(
            error?.error?.message || 'Registration failed. Please try again.',
            'top-right',
            4000
          );
        }
      });
    } else {
      this.toast.warning('Please fill all required fields correctly!', 'top-right', 3000);
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
