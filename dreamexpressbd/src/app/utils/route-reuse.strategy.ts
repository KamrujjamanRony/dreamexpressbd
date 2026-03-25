import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from '@angular/router';

export class CustomReuseStrategy implements RouteReuseStrategy {

  private storedHandles = new Map<string, DetachedRouteHandle>();

  private getKey(route: ActivatedRouteSnapshot): string {
    const path = route.routeConfig?.path ?? '';
    const params = JSON.stringify(route.queryParams);
    return path + '?' + params;
  }

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return !!route.data && route.data['reuse'];
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    const key = this.getKey(route);
    this.storedHandles.set(key, handle);
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    const key = this.getKey(route);
    return this.storedHandles.has(key);
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    const key = this.getKey(route);
    return this.storedHandles.get(key) || null;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }
}