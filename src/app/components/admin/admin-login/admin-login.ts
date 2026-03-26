import { Component, inject, signal } from '@angular/core';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SAuth } from '../../../services/s-auth';
import { SLogin } from '../../../services/s-login';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { SToast } from '../../../utils/toast/toast.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faUser,
  faLock,
  faEye,
  faEyeSlash,
  faShieldHalved,
  faRightToBracket,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-admin-login',
  imports: [ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css',
})
export class AdminLogin {
  private authService = inject(SAuth);
  private loginService = inject(SLogin);
  private loginSubscription?: Subscription;
  private router = inject(Router);
  private toast = inject(SToast);
  fb = inject(NonNullableFormBuilder);

  faUser = faUser;
  faLock = faLock;
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faShieldHalved = faShieldHalved;
  faRightToBracket = faRightToBracket;

  isSubmitted = false;
  loading = signal(false);
  showPassword = signal(false);
  currentYear = new Date().getFullYear();

  form = this.fb.group({
    userName: ['', [Validators.required]],
    password: ['', Validators.required],
  });

  getControl(controlName: string): FormControl {
    return this.form.get(controlName) as FormControl;
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  onSubmit(): void {
    this.isSubmitted = true;
    if (this.form.valid) {
      this.loading.set(true);
      this.loginSubscription = this.loginService.login(this.form.value).subscribe({
        next: (response: any) => {
          this.authService.setUser(response);
          this.toast.success('Login successful!', 'top-right', 3000);
          this.loading.set(false);
          this.form.reset();
          this.router.navigate(['/admin']);
        },
        error: (error) => {
          this.loading.set(false);
          this.toast.warning(
            error?.error?.message || error?.error?.title || 'Invalid credentials!',
            'top-right',
            4000
          );
        },
      });
    } else {
      this.toast.warning('Please fill all required fields!', 'top-right', 3000);
    }
  }

  ngOnDestroy(): void {
    this.loginSubscription?.unsubscribe();
  }
}
