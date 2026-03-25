import { TestBed } from '@angular/core/testing';

import { SSetting } from './s-setting';

describe('SSetting', () => {
  let service: SSetting;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SSetting);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
