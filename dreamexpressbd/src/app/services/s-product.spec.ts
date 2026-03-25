import { TestBed } from '@angular/core/testing';

import { SProduct } from './s-product';

describe('SProduct', () => {
  let service: SProduct;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SProduct);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
