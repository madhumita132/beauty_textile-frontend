import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-contact-us',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NavbarComponent],
  template: `
    <app-navbar />
    <section class="page-wrap">
      <div class="container card">
        <a routerLink="/" class="back-link">← Back to Home</a>
        <h1>Contact Us</h1>
        <p><strong>Phone:</strong> +91 8344515186</p>
        <p><strong>Email:</strong> beautytextile.shop@gmail.com</p>
        <p><strong>Address:</strong> Nadar Sivan Kovil Stop, Aruppukottai-626101</p>
        <p>
          For order support, exchange, return, and delivery queries, contact us directly.
          Our team will help you quickly.
        </p>
      </div>
    </section>
  `,
  styles: [`
    .page-wrap { background:#f6f2eb; min-height: calc(100vh - 64px); padding: 36px 16px; }
    .card { max-width: 900px; background:#fff; border:1px solid #eadcc8; border-radius: 14px; padding: 28px; box-shadow: 0 8px 30px rgba(0,0,0,.05); }
    .back-link { color:#8a5a00; text-decoration:none; font-weight:600; }
    h1 { margin: 12px 0 16px; color:#1f3c68; }
    p { color:#30435f; line-height:1.8; margin: 0 0 10px; }
  `]
})
export class ContactUsComponent {}
