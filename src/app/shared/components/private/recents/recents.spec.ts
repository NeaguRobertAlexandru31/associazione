import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Recents } from './recents';

describe('Recents', () => {
  let component: Recents;
  let fixture: ComponentFixture<Recents>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Recents],
    }).compileComponents();

    fixture = TestBed.createComponent(Recents);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
