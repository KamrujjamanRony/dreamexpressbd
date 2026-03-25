import { TestBed } from '@angular/core/testing';

import { SAuthCookie } from './s-auth-cookie';

describe('SAuthCookie', () => {
  let service: SAuthCookie;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SAuthCookie);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
