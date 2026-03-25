import { TestBed } from '@angular/core/testing';

import { SToken } from './s-token';

describe('SToken', () => {
  let service: SToken;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SToken);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
