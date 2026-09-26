import { ChangeDetectionStrategy, Component } from '@angular/core';

interface ExternalService {
  name: string;
  description: string;
  url: string;
  logo: string;
  color: string;
}

@Component({
  selector: 'app-services',
  imports: [],
  templateUrl: './services.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Services {
  readonly services: ExternalService[] = [
    {
      name: 'Stripe',
      description: 'Gestione pagamenti, abbonamenti e fatturazione',
      url: 'https://dashboard.stripe.com',
      logo: 'assets/logos/stripe.svg',
      color: 'bg-indigo-50 border-indigo-200',
    },
    {
      name: 'AWS',
      description: 'Storage S3, gestione risorse cloud e servizi AWS',
      url: 'https://console.aws.amazon.com',
      logo: 'assets/logos/aws.svg',
      color: 'bg-orange-50 border-orange-200',
    },
  ];

  open(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
