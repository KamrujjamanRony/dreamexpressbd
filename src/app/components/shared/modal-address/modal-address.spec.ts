import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalAddress } from './modal-address';

describe('ModalAddress', () => {
  let component: ModalAddress;
  let fixture: ComponentFixture<ModalAddress>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalAddress]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalAddress);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
