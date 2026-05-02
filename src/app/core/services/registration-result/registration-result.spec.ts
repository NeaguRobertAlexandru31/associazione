import { TestBed } from '@angular/core/testing';

import { RegistrationResult } from './registration-result';

describe('RegistrationResult', () => {
  let service: RegistrationResult;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RegistrationResult);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
