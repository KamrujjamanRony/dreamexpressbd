import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerLogin } from './customer-login';

describe('CustomerLogin', () => {
  let component: CustomerLogin;
  let fixture: ComponentFixture<CustomerLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerLogin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerLogin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
