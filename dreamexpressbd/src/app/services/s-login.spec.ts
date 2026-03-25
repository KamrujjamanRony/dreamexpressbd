import { TestBed } from '@angular/core/testing';

import { SLogin } from './s-login';

describe('SLogin', () => {
  let service: SLogin;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SLogin);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
