import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tessera-preview',
  imports: [CommonModule],
  templateUrl: './tessera-preview.html',
  styleUrl: './tessera-preview.css',
})
export class TesseraPreview {
  flipped = false;

  flip() {
    this.flipped = !this.flipped;
  }
}
