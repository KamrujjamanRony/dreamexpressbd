import { TestBed } from '@angular/core/testing';

import { SCart } from './s-cart';

describe('SCart', () => {
  let service: SCart;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SCart);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
