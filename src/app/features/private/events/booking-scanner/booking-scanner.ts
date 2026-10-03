import {
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  Output,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import jsQR from 'jsqr';
import { EventsService } from '../../../../core/services/events/events';

type ScanStep = 'scanning' | 'loading' | 'result' | 'error';

interface VerifyResult {
  valid: boolean;
  name: string;
  email: string;
  seats: number;
  status: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
}

@Component({
  selector: 'app-booking-scanner',
  templateUrl: './booking-scanner.html',
})
export class BookingScanner implements OnDestroy {
  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @Output() close = new EventEmitter<void>();

  private svc    = inject(EventsService);
  private stream: MediaStream | null = null;
  private rafId: number | null = null;
  private lastScanned = '';

  step    = signal<ScanStep>('scanning');
  result  = signal<VerifyResult | null>(null);
  errMsg  = signal('');
  camErr  = signal('');

  ngAfterViewInit(): void {
    this.startCamera();
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  private async startCamera(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      const video = this.videoRef.nativeElement;
      video.srcObject = this.stream;
      video.play();
      video.addEventListener('playing', () => this.scanLoop(), { once: true });
    } catch {
      this.camErr.set('Impossibile accedere alla fotocamera. Controlla i permessi del browser.');
    }
  }

  private stopCamera(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
  }

  private scanLoop(): void {
    const video  = this.videoRef?.nativeElement;
    const canvas = this.canvasRef?.nativeElement;
    if (!video || !canvas || this.step() !== 'scanning') return;

    const ctx = canvas.getContext('2d')!;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data && code.data !== this.lastScanned) {
      this.lastScanned = code.data;
      this.verify(code.data);
      return;
    }

    this.rafId = requestAnimationFrame(() => this.scanLoop());
  }

  private verify(bookingId: string): void {
    this.step.set('loading');
    this.svc.verifyBooking(bookingId).subscribe({
      next: res => {
        this.result.set(res);
        this.step.set('result');
      },
      error: () => {
        this.errMsg.set('Codice non riconosciuto o prenotazione inesistente.');
        this.step.set('error');
      },
    });
  }

  scanAgain(): void {
    this.lastScanned = '';
    this.result.set(null);
    this.errMsg.set('');
    this.step.set('scanning');
    this.scanLoop();
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('it-IT', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }
}
