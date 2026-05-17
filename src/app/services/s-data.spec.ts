import { TestBed } from '@angular/core/testing';

import { SData } from './s-data';

describe('SData', () => {
  let service: SData;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SData);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
