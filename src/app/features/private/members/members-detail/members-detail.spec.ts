import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MembersDetail } from './members-detail';

describe('MembersDetail', () => {
  let component: MembersDetail;
  let fixture: ComponentFixture<MembersDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MembersDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(MembersDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
