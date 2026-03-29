import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners, provideAppInitializer } from '@angular/core';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { authInterceptor } from './interceptor/auth-interceptor';
import { CustomReuseStrategy } from './utils/route-reuse.strategy';
import { SGuest } from './services/s-guest';
import { firstValueFrom } from 'rxjs';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: RouteReuseStrategy, useClass: CustomReuseStrategy },
    provideHttpClient(withInterceptors([authInterceptor])),
    CookieService,
    provideAppInitializer(() => {
      const guestService = inject(SGuest);
      return firstValueFrom(guestService.initialize());
    }),
  ]
};
