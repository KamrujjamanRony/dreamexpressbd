import { TestBed } from '@angular/core/testing';

import { SWishlist } from './s-wishlist';

describe('SWishlist', () => {
  let service: SWishlist;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SWishlist);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
