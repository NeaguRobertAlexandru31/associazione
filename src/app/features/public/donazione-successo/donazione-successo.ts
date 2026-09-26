import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-donazione-successo',
  imports: [RouterLink],
  templateUrl: './donazione-successo.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DonazioneSuccesso {}
