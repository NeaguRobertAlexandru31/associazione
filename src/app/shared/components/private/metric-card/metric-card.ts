import { Component, input } from '@angular/core';

@Component({
  selector: 'app-metric-card',
  imports: [],
  templateUrl: './metric-card.html',
  styleUrl: './metric-card.css',
})
export class MetricCard {
  icon     = input.required<string>();
  label    = input.required<string>();
  value    = input.required<string>();
  delta    = input.required<string>();
  positive = input.required<boolean>();
  loading  = input<boolean>(false);
}
