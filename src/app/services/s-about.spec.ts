import { TestBed } from '@angular/core/testing';

import { SAbout } from './s-about';

describe('SAbout', () => {
  let service: SAbout;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SAbout);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
