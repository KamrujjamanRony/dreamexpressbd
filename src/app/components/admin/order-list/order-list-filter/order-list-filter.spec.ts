import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderListFilter } from './order-list-filter';

describe('OrderListFilter', () => {
  let component: OrderListFilter;
  let fixture: ComponentFixture<OrderListFilter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderListFilter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderListFilter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
