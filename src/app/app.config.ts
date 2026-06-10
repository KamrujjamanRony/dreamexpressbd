import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners, provideAppInitializer } from '@angular/core';
import { provideRouter, RouteReuseStrategy, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { authInterceptor } from './interceptor/auth-interceptor';
import { CustomReuseStrategy } from './utils/route-reuse.strategy';
import { SGuest } from './services/s-guest';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    { provide: RouteReuseStrategy, useClass: CustomReuseStrategy },
    provideHttpClient(withXhr(), withInterceptors([authInterceptor])),
    CookieService,
    provideAppInitializer(() => {
      // Fire guest token request but don't block render
      const guestService = inject(SGuest);
      guestService.initialize().subscribe();
    }),
  ]
};
