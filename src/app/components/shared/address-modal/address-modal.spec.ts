import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddressModal } from './address-modal';

describe('AddressModal', () => {
  let component: AddressModal;
  let fixture: ComponentFixture<AddressModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddressModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddressModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
