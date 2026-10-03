import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EventsService } from '../../../../core/services/events/events';

type CancelStep = 'loading' | 'confirm' | 'success' | 'error';

@Component({
  selector: 'app-booking-cancel',
  imports: [RouterLink],
  templateUrl: './booking-cancel.html',
})
export class BookingCancel implements OnInit {
  private route = inject(ActivatedRoute);
  private svc   = inject(EventsService);

  step        = signal<CancelStep>('confirm');
  sending     = signal(false);
  cancelToken = signal('');

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('cancelToken')!;
    this.cancelToken.set(token);
  }

  confirm(): void {
    const token = this.cancelToken();
    if (!token) return;
    this.sending.set(true);
    this.svc.cancelBooking(token).subscribe({
      next: () => { this.sending.set(false); this.step.set('success'); },
      error: () => { this.sending.set(false); this.step.set('error'); },
    });
  }
}
