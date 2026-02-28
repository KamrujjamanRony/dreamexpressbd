import { TestBed } from '@angular/core/testing';

import { SCategory } from './s-category';

describe('SCategory', () => {
  let service: SCategory;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SCategory);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
