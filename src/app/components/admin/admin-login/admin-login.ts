import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { form, FormField, required, validate, debounce } from '@angular/forms/signals';
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
  imports: [FormsModule, FormField, FontAwesomeModule],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css',
})
export class AdminLogin {
  private authService = inject(SAuth);
  private loginService = inject(SLogin);
  private loginSubscription?: Subscription;
  private router = inject(Router);
  private toast = inject(SToast);

  faUser = faUser;
  faLock = faLock;
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faShieldHalved = faShieldHalved;
  faRightToBracket = faRightToBracket;

  loading = signal(false);
  showPassword = signal(false);
  currentYear = new Date().getFullYear();

  /* ---------------- FORM MODEL ---------------- */
  model = signal({
    userName: '',
    password: '',
  });

  /* ---------------- SIGNAL FORM ---------------- */
  form = form(this.model, (schemaPath) => {
    required(schemaPath.userName, { message: 'Username is required' });
    required(schemaPath.password, { message: 'Password is required' });

    validate(schemaPath.userName, ({ value }) => {
      if (value() && value().length < 3) {
        return { kind: 'minLength', message: 'Username must be at least 3 characters' };
      }
      if (value() && value().length > 30) {
        return { kind: 'maxLength', message: 'Username must be less than 30 characters' };
      }
      return null;
    });

    validate(schemaPath.password, ({ value }) => {
      if (value() && value().length < 6) {
        return { kind: 'minLength', message: 'Password must be at least 6 characters' };
      }
      if (value() && value().length > 50) {
        return { kind: 'maxLength', message: 'Password must be less than 50 characters' };
      }
      return null;
    });

    debounce(schemaPath.userName, 300);
    debounce(schemaPath.password, 300);
  });

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  onSubmit(): void {
    if (!this.form().valid()) {
      this.toast.warning('Please fill all required fields!', 'top-right', 3000);
      return;
    }

    this.loading.set(true);
    const formValue = this.form().value();
    this.loginSubscription = this.loginService.login(formValue).subscribe({
      next: (response: any) => {
        this.authService.setUser(response);
        this.toast.success('Login successful!', 'top-right', 3000);
        this.loading.set(false);
        this.formReset();
        this.router.navigate(['/admin']);
      },
      error: (error) => {
        this.loading.set(false);
        this.toast.warning(
          error?.error || 'Invalid credentials!',
          'top-right',
          4000
        );
      },
    });
  }

  formReset(): void {
    this.model.set({ userName: '', password: '' });
    this.form().reset();
  }

  ngOnDestroy(): void {
    this.loginSubscription?.unsubscribe();
  }
}
