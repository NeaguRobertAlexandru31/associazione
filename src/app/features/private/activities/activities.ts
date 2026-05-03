import { Component } from '@angular/core';
import { Recents } from '../../../shared/components/private/recents/recents';

@Component({
  selector: 'app-activities',
  imports: [Recents],
  templateUrl: './activities.html',
  styleUrl: './activities.css',
})
export class Activities {}
