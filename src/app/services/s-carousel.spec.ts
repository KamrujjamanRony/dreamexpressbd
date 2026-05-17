import { TestBed } from '@angular/core/testing';

import { SCarousel } from './s-carousel';

describe('SCarousel', () => {
  let service: SCarousel;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SCarousel);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
