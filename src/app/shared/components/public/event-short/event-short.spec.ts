import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventShort } from './event-short';

describe('EventShort', () => {
  let component: EventShort;
  let fixture: ComponentFixture<EventShort>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventShort],
    }).compileComponents();

    fixture = TestBed.createComponent(EventShort);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
