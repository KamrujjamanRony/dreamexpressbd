import { Injectable, signal } from '@angular/core';
import { Router, NavigationEnd, ActivatedRouteSnapshot } from '@angular/router';
import { filter } from 'rxjs';
import { BreadcrumbM } from './breadcrumb.model';

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  readonly breadcrumbs = signal<BreadcrumbM[]>([]);

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        const root = this.router.routerState.snapshot.root;
        this.breadcrumbs.set(this.build(root));
      });
  }

  private build(
    route: ActivatedRouteSnapshot,
    url: string = '',
    acc: BreadcrumbM[] = []
  ): BreadcrumbM[] {
    const routeUrl = route.url.map(s => s.path).join('/');
    if (routeUrl) {
      url += `/${routeUrl}`;
    }

    const label =
      route.data['breadcrumb'] ??
      this.extractTitle(route) ??
      routeUrl;

    if (label) {
      acc.push({ label, url });
    }

    for (const child of route.children) {
      this.build(child, url, acc);
    }

    return acc;
  }

  private extractTitle(route: ActivatedRouteSnapshot): string | null {
    const title = route.title;
    if (!title) return null;

    // "Dashboard | Company" → "Dashboard"
    return title.split('|')[0].trim();
  }
}
