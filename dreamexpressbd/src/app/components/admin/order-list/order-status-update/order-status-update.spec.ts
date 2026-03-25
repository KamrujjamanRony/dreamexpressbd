import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderStatusUpdate } from './order-status-update';

describe('OrderStatusUpdate', () => {
  let component: OrderStatusUpdate;
  let fixture: ComponentFixture<OrderStatusUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderStatusUpdate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderStatusUpdate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
