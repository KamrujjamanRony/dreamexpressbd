import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewContent } from './view-content';

describe('ViewContent', () => {
  let component: ViewContent;
  let fixture: ComponentFixture<ViewContent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewContent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewContent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
