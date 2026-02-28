import { TestBed } from '@angular/core/testing';

import { SAuth } from './s-auth';

describe('SAuth', () => {
  let service: SAuth;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SAuth);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
