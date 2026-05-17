import { TestBed } from '@angular/core/testing';

import { SPermission } from './s-permission';

describe('SPermission', () => {
  let service: SPermission;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SPermission);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
