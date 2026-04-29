import { Component, inject, signal, afterNextRender, viewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SCustomer } from '../../../services/s-customer';
import { SAuthCookie } from '../../../services/s-auth-cookie';
import { SToast } from '../../../utils/toast/toast.service';
import { SCart } from '../../../services/s-cart';
import { SWishlist } from '../../../services/s-wishlist';
import { environment } from '../../../../environments/environment';
import { CustomerM } from '../../../models/Customer';
import { form, FormField, required, validate, debounce } from '@angular/forms/signals';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { SGoogleAuth } from '../../../services/s-google-auth';
import { SFacebookAuth, FacebookUser } from '../../../services/s-facebook-auth';

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
  private googleAuth = inject(SGoogleAuth);
  private facebookAuth = inject(SFacebookAuth);

  faEye = faEye;
  faEyeSlash = faEyeSlash;

  loading = signal(false);
  showPassword = signal(false);
  googleLoading = signal(false);
  facebookLoading = signal(false);
  googleBtnEl = viewChild<ElementRef>('googleBtn');

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

  /* ---------------- FORM MODEL ---------------- */
  model = signal({
    emailOrPhone: '',
    password: '',
  });

  /* ---------------- SIGNAL FORM ---------------- */
  form = form(this.model, (schemaPath) => {
    required(schemaPath.emailOrPhone, { message: 'Email or phone is required' });
    required(schemaPath.password, { message: 'Password is required' });

    validate(schemaPath.emailOrPhone, ({ value }) => {
      if (value() && value().length < 3) {
        return { kind: 'minLength', message: 'Enter a valid email or phone number' };
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

    debounce(schemaPath.emailOrPhone, 300);
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
    this.customerService.login(formValue.emailOrPhone, formValue.password)
      .subscribe({
        next: (response: any) => {
          this.authCookie.login(response);
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
            error?.error || 'Invalid email/phone or password!',
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

    // Try login by email first
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
                this.toast.danger('Google login failed!', 'top-right', 4000);
              },
            });
          },
          error: () => {
            this.googleLoading.set(false);
            this.toast.danger('Google login failed!', 'top-right', 4000);
          },
        });
      },
    });
  }

  private onSocialSuccess(response: any, socialData: { loginProvider: string; providerKey: string; profileImage: string }): void {
    const merged = { ...response, ...socialData };
    this.authCookie.login(merged);
    // Update backend with social data
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
                  this.toast.danger('Facebook login failed!', 'top-right', 4000);
                },
              });
            },
            error: () => {
              this.facebookLoading.set(false);
              this.toast.danger('Facebook login failed!', 'top-right', 4000);
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
    this.model.set({ emailOrPhone: '', password: '' });
    this.form().reset();
  }
}
