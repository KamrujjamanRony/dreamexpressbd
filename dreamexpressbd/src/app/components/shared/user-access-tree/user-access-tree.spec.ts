import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserAccessTree } from './user-access-tree';

describe('UserAccessTree', () => {
  let component: UserAccessTree;
  let fixture: ComponentFixture<UserAccessTree>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserAccessTree]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserAccessTree);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
