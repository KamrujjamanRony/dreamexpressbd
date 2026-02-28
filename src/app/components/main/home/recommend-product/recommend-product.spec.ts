import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecommendProduct } from './recommend-product';

describe('RecommendProduct', () => {
  let component: RecommendProduct;
  let fixture: ComponentFixture<RecommendProduct>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecommendProduct]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecommendProduct);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
