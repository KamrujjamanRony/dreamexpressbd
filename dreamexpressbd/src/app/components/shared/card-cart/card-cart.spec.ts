import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardCart } from './card-cart';

describe('CardCart', () => {
  let component: CardCart;
  let fixture: ComponentFixture<CardCart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardCart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardCart);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
