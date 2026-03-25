import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WishlistCard } from './wishlist-card';

describe('WishlistCard', () => {
  let component: WishlistCard;
  let fixture: ComponentFixture<WishlistCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WishlistCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WishlistCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
