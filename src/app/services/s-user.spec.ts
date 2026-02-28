import { TestBed } from '@angular/core/testing';

import { SUser } from './s-user';

describe('SUser', () => {
  let service: SUser;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SUser);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
