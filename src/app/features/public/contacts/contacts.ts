import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../i18n/translate.pipe';
import { ContactService } from '../../../core/services/contact/contact';

@Component({
  selector: 'app-contacts',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './contacts.html',
  styleUrl: './contacts.css',
})
export class Contacts {
  private contactService = inject(ContactService);

  // Form
  name = '';
  email = '';
  subject = '';
  message = '';
  sending = signal(false);
  sent = signal(false);

  submitForm(): void {
    if (!this.name || !this.email || !this.message || this.sending()) return;
    this.sending.set(true);
    this.contactService.send({ name: this.name, email: this.email, subject: this.subject, message: this.message }).subscribe({
      next: () => {
        this.sending.set(false);
        this.sent.set(true);
        setTimeout(() => {
          this.sent.set(false);
          this.name = this.email = this.subject = this.message = '';
        }, 3000);
      },
      error: () => this.sending.set(false),
    });
  }

  // Newsletter
  newsletterEmail = '';
  newsletterDone = signal(false);

  submitNewsletter(): void {
    if (!this.newsletterEmail) return;
    // TODO: newsletter service
    console.log('Newsletter:', this.newsletterEmail);
    this.newsletterDone.set(true);
    setTimeout(() => {
      this.newsletterDone.set(false);
      this.newsletterEmail = '';
    }, 3000);
  }

  readonly mapsUrl = 'https://maps.google.com/?q=Via+del+Corso+123+Roma';
}
