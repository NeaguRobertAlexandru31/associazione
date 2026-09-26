import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashFab } from './dash-fab';

describe('DashFab', () => {
  let component: DashFab;
  let fixture: ComponentFixture<DashFab>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashFab],
    }).compileComponents();

    fixture = TestBed.createComponent(DashFab);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
