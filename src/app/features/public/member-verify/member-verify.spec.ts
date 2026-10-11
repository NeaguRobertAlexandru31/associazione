import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemberVerify } from './member-verify';

describe('MemberVerify', () => {
  let component: MemberVerify;
  let fixture: ComponentFixture<MemberVerify>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemberVerify],
    }).compileComponents();

    fixture = TestBed.createComponent(MemberVerify);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
