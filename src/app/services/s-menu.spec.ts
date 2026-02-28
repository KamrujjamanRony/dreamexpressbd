import { TestBed } from '@angular/core/testing';

import { SMenu } from './s-menu';

describe('SMenu', () => {
  let service: SMenu;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SMenu);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
