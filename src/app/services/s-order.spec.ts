import { TestBed } from '@angular/core/testing';

import { SOrder } from './s-order';

describe('SOrder', () => {
  let service: SOrder;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SOrder);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
