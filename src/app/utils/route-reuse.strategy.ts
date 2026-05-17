import {
  ActivatedRouteSnapshot,
  DetachedRouteHandle,
  PRIMARY_OUTLET,
  RouteReuseStrategy,
} from '@angular/router';

export class CustomReuseStrategy implements RouteReuseStrategy {
  private storedHandles = new Map<string, DetachedRouteHandle>();

  private isReusable(route: ActivatedRouteSnapshot): boolean {
    return route.routeConfig !== null && route.data['reuse'] === true;
  }

  private getKey(route: ActivatedRouteSnapshot): string {
    const routePath = route.pathFromRoot
      .map((snapshot) => `${snapshot.outlet || PRIMARY_OUTLET}:${snapshot.routeConfig?.path ?? ''}`)
      .join('//');
    const params = JSON.stringify(route.pathFromRoot.map((snapshot) => snapshot.params ?? {}));
    const queryParams = JSON.stringify(route.queryParams ?? {});

    return `${routePath}?params=${params}&query=${queryParams}`;
  }

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return this.isReusable(route);
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    if (!this.isReusable(route) || handle === null) {
      return;
    }

    this.storedHandles.set(this.getKey(route), handle);
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return this.isReusable(route) && this.storedHandles.has(this.getKey(route));
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    if (!this.isReusable(route)) {
      return null;
    }

    return this.storedHandles.get(this.getKey(route)) ?? null;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }
}
