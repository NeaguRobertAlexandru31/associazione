import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-iscrizione-successo',
  imports: [RouterLink],
  templateUrl: './iscrizione-successo.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IscrizioneSuccesso {}
