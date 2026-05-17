import { ChangeDetectionStrategy, Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { Router, RouterOutlet, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../environments/environment';
import { Toast } from './utils/toast/toast';
import { Confirm } from "./utils/confirm/confirm";
import { SocialChat } from "./utils/social-chat/social-chat";
import { CartDrawer } from "./utils/cart-drawer/cart-drawer";
import { SSeo } from './services/s-seo';
import { SMetaPixel } from './services/s-meta-pixel';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast, Confirm, SocialChat, CartDrawer],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private readonly staleChunkReloadKey = 'stale_chunk_reload_attempted';
  private readonly deploymentCheckIntervalMs = 60_000;
  private seo = inject(SSeo);
  private metaPixel = inject(SMetaPixel);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private deploymentCheckInFlight = false;
  protected readonly title = signal(environment.companyName);
  protected readonly routeLoading = signal(false);

  ngOnInit() {
    this.seo.init();
    this.metaPixel.init();
    this.registerStaleChunkRecovery();
    this.registerDeploymentRefresh();
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(event => {
      if (event instanceof NavigationStart) {
        this.routeLoading.set(true);
      } else if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
        this.routeLoading.set(false);
        if (event instanceof NavigationEnd) {
          sessionStorage.removeItem(this.staleChunkReloadKey);
          this.metaPixel.trackPageView(`${window.location.origin}${event.urlAfterRedirects}`);
        } else if (event instanceof NavigationError) {
          this.handleNavigationError(event.error);
        }
      }
    });
  }

  private handleNavigationError(error: unknown) {
    if (!this.isStaleChunkError(error)) {
      return;
    }

    this.reloadApplication();
  }

  private registerStaleChunkRecovery() {
    const onError = (event: Event | ErrorEvent) => {
      const error = event instanceof ErrorEvent ? event.error ?? event.message : event;
      if (this.isStaleChunkError(error)) {
        this.reloadApplication();
      }
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (this.isStaleChunkError(event.reason)) {
        this.reloadApplication();
      }
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    });
  }

  private registerDeploymentRefresh() {
    const checkForNewDeployment = () => {
      void this.checkForNewDeployment();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForNewDeployment();
      }
    };

    const intervalId = window.setInterval(checkForNewDeployment, this.deploymentCheckIntervalMs);

    window.addEventListener('focus', checkForNewDeployment);
    document.addEventListener('visibilitychange', onVisibilityChange);

    this.destroyRef.onDestroy(() => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', checkForNewDeployment);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    });
  }

  private async checkForNewDeployment() {
    if (this.deploymentCheckInFlight || !navigator.onLine) {
      return;
    }

    const currentShellSignature = this.getCurrentShellSignature();
    if (!currentShellSignature) {
      return;
    }

    this.deploymentCheckInFlight = true;

    try {
      const response = await fetch(this.getAppShellUrl(), {
        cache: 'no-store',
        headers: {
          Accept: 'text/html',
        },
      });

      const contentType = response.headers.get('content-type') ?? '';
      if (!response.ok || !/text\/html/i.test(contentType)) {
        return;
      }

      const latestShellSignature = this.getShellSignatureFromHtml(await response.text());
      if (latestShellSignature && latestShellSignature !== currentShellSignature) {
        this.reloadApplication();
      }
    } catch {
      // Ignore transient network failures; the next check will retry.
    } finally {
      this.deploymentCheckInFlight = false;
    }
  }

  private reloadApplication() {
    // Refresh once when a deploy invalidates the running app shell or a lazy chunk.
    if (sessionStorage.getItem(this.staleChunkReloadKey) !== '1') {
      sessionStorage.setItem(this.staleChunkReloadKey, '1');
      window.location.replace(window.location.href);
      return;
    }

    sessionStorage.removeItem(this.staleChunkReloadKey);
  }

  private isStaleChunkError(error: unknown): boolean {
    const message = this.getErrorMessage(error);

    return /Failed to fetch dynamically imported module|ChunkLoadError|Importing a module script failed|Failed to load module script|module script|chunk-[A-Z0-9]+\.js/i.test(message);
  }

  private getCurrentShellSignature(): string {
    // Parse the live shell with the same rules as fetched HTML so modulepreload links
    // and other hashed app assets don't trigger a false positive deployment refresh.
    return this.getShellSignatureFromHtml(document.documentElement.outerHTML);
  }

  private getShellSignatureFromHtml(html: string): string {
    const assetMatches = Array.from(html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css)(?:\?[^"']*)?)["']/gi), match => match[1]);

    return this.getTrackedAssetNames(assetMatches).join('|');
  }

  private getTrackedAssetNames(assetUrls: string[]): string[] {
    return Array.from(new Set(assetUrls
      .map(url => this.getAssetFileName(url))
      .filter(name => /^(?:main|styles|chunk)-.+\.(?:js|css)$/i.test(name))))
      .sort();
  }

  private getAssetFileName(assetUrl: string): string {
    try {
      return new URL(assetUrl, window.location.href).pathname.split('/').pop() ?? '';
    } catch {
      return assetUrl.split('?')[0].split('/').pop() ?? '';
    }
  }

  private getAppShellUrl(): string {
    const baseHref = document.querySelector('base')?.href;

    return new URL(baseHref ?? '/', window.location.href).toString();
  }

  private getErrorMessage(error: unknown): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'object' && error !== null && 'message' in error) {
      const value = (error as { message?: unknown }).message;
      return typeof value === 'string' ? value : '';
    }

    if (error instanceof Event) {
      const target = error.target as { src?: string; href?: string } | null;
      return `${target?.src ?? target?.href ?? ''}`;
    }

    return '';
  }
}
