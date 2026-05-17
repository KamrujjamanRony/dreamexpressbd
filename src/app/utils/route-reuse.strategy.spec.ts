import { ActivatedRouteSnapshot, DetachedRouteHandle, PRIMARY_OUTLET, Route } from '@angular/router';

import { CustomReuseStrategy } from './route-reuse.strategy';

describe('CustomReuseStrategy', () => {
  let strategy: CustomReuseStrategy;
  let handle: DetachedRouteHandle;

  beforeEach(() => {
    strategy = new CustomReuseStrategy();
    handle = {} as DetachedRouteHandle;
  });

  it('reattaches only routes explicitly marked reusable', () => {
    const reusableHome = createSnapshot({ path: '', data: { reuse: true } });
    const mainLayout = createSnapshot({ path: '', data: {} });

    strategy.store(reusableHome, handle);

    expect(strategy.shouldAttach(mainLayout)).toBe(false);
    expect(strategy.retrieve(mainLayout)).toBeNull();
    expect(strategy.shouldAttach(reusableHome)).toBe(true);
    expect(strategy.retrieve(reusableHome)).toBe(handle);
  });

  it('uses route params as part of the reuse key', () => {
    const firstProduct = createSnapshot({
      path: 'view/:id',
      data: { reuse: true },
      params: { id: '1' },
    });
    const secondProduct = createSnapshot({
      path: 'view/:id',
      data: { reuse: true },
      params: { id: '2' },
    });

    strategy.store(firstProduct, handle);

    expect(strategy.shouldAttach(secondProduct)).toBe(false);
    expect(strategy.retrieve(secondProduct)).toBeNull();
  });

  it('uses route ancestry as part of the reuse key', () => {
    const rootHome = createSnapshot({
      path: '',
      data: { reuse: true },
      parentPaths: [''],
    });
    const nestedHome = createSnapshot({
      path: '',
      data: { reuse: true },
      parentPaths: ['admin'],
    });

    strategy.store(rootHome, handle);

    expect(strategy.shouldAttach(nestedHome)).toBe(false);
    expect(strategy.retrieve(nestedHome)).toBeNull();
  });
});

function createSnapshot({
  path,
  data = {},
  params = {},
  queryParams = {},
  parentPaths = [],
}: {
  path: string;
  data?: Record<string, unknown>;
  params?: Record<string, string>;
  queryParams?: Record<string, string>;
  parentPaths?: string[];
}): ActivatedRouteSnapshot {
  const parents = parentPaths.map(
    (parentPath) =>
      ({
        routeConfig: { path: parentPath } as Route,
        outlet: PRIMARY_OUTLET,
        params: {},
      }) as ActivatedRouteSnapshot,
  );

  const route = {
    routeConfig: { path } as Route,
    data,
    params,
    queryParams,
    outlet: PRIMARY_OUTLET,
  } as ActivatedRouteSnapshot;

  Object.defineProperty(route, 'pathFromRoot', {
    value: [...parents, route],
  });

  return route;
}
