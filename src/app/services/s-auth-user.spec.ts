import { TestBed } from '@angular/core/testing';

import { SAuthUser } from './s-auth-user';

describe('SAuthUser', () => {
  let service: SAuthUser;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SAuthUser);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
