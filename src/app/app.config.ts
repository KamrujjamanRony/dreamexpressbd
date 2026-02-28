import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, RouteReuseStrategy, withHashLocation } from '@angular/router';

import { routes } from './app.routes';
import { CustomReuseStrategy } from './services/route-reuse.strategy';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { authInterceptor } from './interceptor/auth-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withHashLocation()),
    { provide: RouteReuseStrategy, useClass: CustomReuseStrategy },
    provideHttpClient(withInterceptors([authInterceptor])),
    CookieService
  ]
};
