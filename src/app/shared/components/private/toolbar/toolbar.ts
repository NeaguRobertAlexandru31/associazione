import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-toolbar',
  imports: [],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.css',
})
export class Toolbar {
  active = input<boolean>(false);
  count  = input<number>(0);

  delete = output<void>();
}
