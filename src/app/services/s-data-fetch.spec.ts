import { TestBed } from '@angular/core/testing';

import { SDataFetch } from './s-data-fetch';

describe('SDataFetch', () => {
  let service: SDataFetch;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SDataFetch);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
