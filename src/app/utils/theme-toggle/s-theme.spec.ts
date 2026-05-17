import { TestBed } from '@angular/core/testing';

import { STheme } from './s-theme';

describe('STheme', () => {
  let service: STheme;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(STheme);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
