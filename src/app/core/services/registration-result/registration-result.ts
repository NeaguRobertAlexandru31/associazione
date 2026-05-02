import { Injectable, signal } from '@angular/core';
import { RegistrationResult } from '../../models/registration.model';

@Injectable({ providedIn: 'root' })
export class RegistrationResultService {
  readonly result = signal<RegistrationResult | null>(null);

  set(r: RegistrationResult): void { this.result.set(r); }
  clear(): void                    { this.result.set(null); }
}
