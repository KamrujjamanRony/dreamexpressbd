import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactUpdate } from './contact-update';

describe('ContactUpdate', () => {
  let component: ContactUpdate;
  let fixture: ComponentFixture<ContactUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactUpdate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContactUpdate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
