import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutUpdate } from './about-update';

describe('AboutUpdate', () => {
  let component: AboutUpdate;
  let fixture: ComponentFixture<AboutUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutUpdate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AboutUpdate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
