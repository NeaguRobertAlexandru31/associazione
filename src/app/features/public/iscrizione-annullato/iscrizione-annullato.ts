import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-iscrizione-annullato',
  imports: [RouterLink],
  templateUrl: './iscrizione-annullato.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IscrizioneAnnullato {}
