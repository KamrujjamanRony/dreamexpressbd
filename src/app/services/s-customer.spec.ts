import { TestBed } from '@angular/core/testing';

import { SCustomer } from './s-customer';

describe('SCustomer', () => {
  let service: SCustomer;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SCustomer);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
