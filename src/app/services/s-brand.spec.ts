import { TestBed } from '@angular/core/testing';

import { SBrand } from './s-brand';

describe('SBrand', () => {
  let service: SBrand;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SBrand);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
