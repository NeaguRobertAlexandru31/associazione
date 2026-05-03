import { Component } from '@angular/core';
import { EventCalendar } from '../../../shared/components/private/event-calendar/event-calendar';

@Component({
  selector: 'app-private-events',
  imports: [EventCalendar],
  templateUrl: './events.html',
  styleUrl: './events.css',
})
export class Events {}
