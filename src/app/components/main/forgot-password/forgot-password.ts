import { Component, inject, signal, afterNextRender, viewChild, ElementRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { SCustomer } from '../../../services/s-customer';
import { SToast } from '../../../utils/toast/toast.service';
import { environment } from '../../../../environments/environment';
import { SGoogleAuth } from '../../../services/s-google-auth';
import { SFacebookAuth, FacebookUser } from '../../../services/s-facebook-auth';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-forgot-password',
    imports: [RouterLink, FontAwesomeModule, FormsModule],
    templateUrl: './forgot-password.html',
    styleUrl: './forgot-password.css',
})
export class ForgotPassword {
    private customerService = inject(SCustomer);
    private toast = inject(SToast);
    private router = inject(Router);
    private googleAuth = inject(SGoogleAuth);
    private facebookAuth = inject(SFacebookAuth);

    faEye = faEye;
    faEyeSlash = faEyeSlash;

    // Step: 1 = enter email, 2 = verify via social, 3 = set new password, 4 = done
    step = signal<number>(1);
    loading = signal(false);
    googleLoading = signal(false);
    facebookLoading = signal(false);
    showPassword = signal(false);
    showConfirmPassword = signal(false);

    email = signal('');
    newPassword = signal('');
    confirmPassword = signal('');
    foundCustomer = signal<any>(null);
    verifiedEmail = signal('');
    googleBtnEl = viewChild<ElementRef>('googleBtn');

    constructor() {
        afterNextRender(() => {
            this.googleAuth.initialize((credential) => {
                this.handleGoogleVerify(credential);
            });
            this.facebookAuth.initialize();
        });
    }

    // Step 1: Search for customer by email
    onSearchEmail(): void {
        const emailVal = this.email().trim();
        if (!emailVal) {
            this.toast.warning('Please enter your email!', 'top-right', 3000);
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
            this.toast.warning('Please enter a valid email address!', 'top-right', 3000);
            return;
        }

        this.loading.set(true);
        this.customerService.search().subscribe({
            next: (customers) => {
                const found = customers.find(
                    (c: any) => c.email?.toLowerCase() === emailVal.toLowerCase()
                );
                if (found) {
                    this.foundCustomer.set(found);
                    this.step.set(2);
                    // Render Google button after step change
                    setTimeout(() => {
                        const el = this.googleBtnEl()?.nativeElement;
                        if (el) this.googleAuth.renderButton(el);
                    }, 100);
                } else {
                    this.toast.danger('No account found with this email!', 'top-right', 4000);
                }
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.toast.danger('Something went wrong. Please try again!', 'top-right', 4000);
            },
        });
    }

    // Step 2: Verify identity via Google
    handleGoogleVerify(credential: string): void {
        const payload = this.decodeJwt(credential);
        if (!payload?.email) {
            this.toast.danger('Invalid Google credential!', 'top-right', 4000);
            return;
        }

        this.googleLoading.set(true);
        const customer = this.foundCustomer();

        if (payload.email.toLowerCase() === customer?.email?.toLowerCase()) {
            this.verifiedEmail.set(payload.email);
            this.step.set(3);
            this.googleLoading.set(false);
            this.toast.success('Identity verified! Set your new password.', 'top-right', 3000);
        } else {
            this.googleLoading.set(false);
            this.toast.danger(
                'Google email does not match! Please use the same email.',
                'top-right',
                4000
            );
        }
    }

    // Step 2: Verify identity via Facebook
    handleFacebookVerify(): void {
        this.facebookLoading.set(true);
        this.facebookAuth.login((user: FacebookUser | null) => {
            if (!user?.email) {
                this.facebookLoading.set(false);
                this.toast.danger('Facebook login failed! Email is required.', 'top-right', 4000);
                return;
            }

            const customer = this.foundCustomer();
            if (user.email.toLowerCase() === customer?.email?.toLowerCase()) {
                this.verifiedEmail.set(user.email);
                this.step.set(3);
                this.facebookLoading.set(false);
                this.toast.success('Identity verified! Set your new password.', 'top-right', 3000);
            } else {
                this.facebookLoading.set(false);
                this.toast.danger(
                    'Facebook email does not match! Please use the same email.',
                    'top-right',
                    4000
                );
            }
        });
    }

    // Step 3: Reset password
    onResetPassword(): void {
        const pass = this.newPassword().trim();
        const confirm = this.confirmPassword().trim();

        if (!pass) {
            this.toast.warning('Please enter a new password!', 'top-right', 3000);
            return;
        }
        if (pass.length < 6) {
            this.toast.warning('Password must be at least 6 characters!', 'top-right', 3000);
            return;
        }
        if (pass.length > 25) {
            this.toast.warning('Password must be less than 25 characters!', 'top-right', 3000);
            return;
        }
        if (!/[A-Z]/.test(pass)) {
            this.toast.warning('Password must contain at least one uppercase letter!', 'top-right', 3000);
            return;
        }
        if (!/[a-z]/.test(pass)) {
            this.toast.warning('Password must contain at least one lowercase letter!', 'top-right', 3000);
            return;
        }
        if (!/[0-9]/.test(pass)) {
            this.toast.warning('Password must contain at least one number!', 'top-right', 3000);
            return;
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) {
            this.toast.warning('Password must contain at least one special character!', 'top-right', 3000);
            return;
        }
        if (pass !== confirm) {
            this.toast.warning('Passwords do not match!', 'top-right', 3000);
            return;
        }

        this.loading.set(true);
        const customer = this.foundCustomer();

        this.customerService.update(customer.id, {
            ...customer,
            pass,
            companyID: environment.companyCode,
        }).subscribe({
            next: () => {
                this.loading.set(false);
                this.step.set(4);
                this.toast.success('Password reset successfully!', 'top-right', 3000);
            },
            error: () => {
                this.loading.set(false);
                this.toast.danger('Failed to reset password. Please try again!', 'top-right', 4000);
            },
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
}
