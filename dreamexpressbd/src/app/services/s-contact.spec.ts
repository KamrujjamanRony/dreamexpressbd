import { TestBed } from '@angular/core/testing';

import { SContact } from './s-contact';

describe('SContact', () => {
  let service: SContact;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SContact);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
