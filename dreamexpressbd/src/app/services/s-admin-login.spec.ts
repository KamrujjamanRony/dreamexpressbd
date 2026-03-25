import { TestBed } from '@angular/core/testing';

import { SAdminLogin } from './s-admin-login';

describe('SAdminLogin', () => {
  let service: SAdminLogin;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SAdminLogin);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
