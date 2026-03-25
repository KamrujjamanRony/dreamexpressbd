import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserOrderDetails } from './user-order-details';

describe('UserOrderDetails', () => {
  let component: UserOrderDetails;
  let fixture: ComponentFixture<UserOrderDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserOrderDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserOrderDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
