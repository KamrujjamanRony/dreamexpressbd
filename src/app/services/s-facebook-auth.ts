import { inject, Injectable, NgZone } from '@angular/core';
import { environment } from '../../environments/environment';

declare const FB: any;

export interface FacebookUser {
    id: string;
    name: string;
    email: string;
    picture?: { data?: { url?: string } };
}

@Injectable({ providedIn: 'root' })
export class SFacebookAuth {
    private ngZone = inject(NgZone);
    private initPromise: Promise<boolean> | null = null;
    private scriptLoaded = false;

    private loadScript(): void {
        if (this.scriptLoaded || document.querySelector('script[src*="connect.facebook.net"]')) {
            this.scriptLoaded = true;
            return;
        }
        this.scriptLoaded = true;
        const script = document.createElement('script');
        script.src = 'https://connect.facebook.net/en_US/sdk.js';
        script.async = true;
        script.defer = true;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
    }

    initialize(): Promise<boolean> {
        this.loadScript();

        if (!this.initPromise) {
            this.initPromise = new Promise<boolean>((resolve) => {
                const check = setInterval(() => {
                    if (typeof FB !== 'undefined') {
                        clearInterval(check);
                        FB.init({
                            appId: environment.facebookAppId,
                            cookie: true,
                            xfbml: false,
                            version: 'v21.0',
                        });
                        resolve(true);
                    }
                }, 100);
                setTimeout(() => { clearInterval(check); resolve(false); }, 10000);
            });
        }
        return this.initPromise;
    }

    login(callback: (user: FacebookUser | null) => void): void {
        if (typeof FB === 'undefined') {
            callback(null);
            return;
        }

        FB.login((loginResponse: any) => {
            if (loginResponse.authResponse) {
                FB.api('/me', { fields: 'id,name,email,picture.width(200)' }, (userInfo: any) => {
                    this.ngZone.run(() => {
                        if (userInfo && !userInfo.error) {
                            callback(userInfo as FacebookUser);
                        } else {
                            callback(null);
                        }
                    });
                });
            } else {
                this.ngZone.run(() => callback(null));
            }
        }, { scope: 'public_profile,email' });
    }
}
