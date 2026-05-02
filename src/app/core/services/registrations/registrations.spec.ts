import { TestBed } from '@angular/core/testing';

import { Registrations } from './registrations';

describe('Registrations', () => {
  let service: Registrations;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Registrations);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
