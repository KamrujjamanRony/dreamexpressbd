import { inject, Injectable, NgZone } from '@angular/core';
import { environment } from '../../environments/environment';

declare const google: any;

@Injectable({ providedIn: 'root' })
export class SGoogleAuth {
  private ngZone = inject(NgZone);
  private callbackFn: ((credential: string) => void) | null = null;
  private initPromise: Promise<boolean> | null = null;
  private scriptLoaded = false;

  private loadScript(): void {
    if (this.scriptLoaded || document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      this.scriptLoaded = true;
      return;
    }
    this.scriptLoaded = true;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }

  initialize(callback: (credential: string) => void): Promise<boolean> {
    this.callbackFn = callback;
    this.loadScript();

    if (!this.initPromise) {
      this.initPromise = new Promise<boolean>((resolve) => {
        const check = setInterval(() => {
          if (typeof google !== 'undefined' && google.accounts?.id) {
            clearInterval(check);
            google.accounts.id.initialize({
              client_id: environment.googleClientId,
              callback: (response: any) => {
                this.ngZone.run(() => this.callbackFn?.(response.credential));
              },
            });
            resolve(true);
          }
        }, 100);
        setTimeout(() => { clearInterval(check); resolve(false); }, 10000);
      });
    }

    return this.initPromise;
  }

  renderButton(element: HTMLElement): void {
    if (typeof google !== 'undefined' && google.accounts?.id) {
      google.accounts.id.renderButton(element, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        logo_alignment: 'center',
      });
    }
  }
}
