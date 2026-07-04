import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-policy-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NavbarComponent],
  template: `
    <app-navbar />
    <section class="page-wrap">
      <div class="container card">
        <a routerLink="/" class="back-link">← Back to Home</a>
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
      </div>
    </section>
  `,
  styles: [`
    .page-wrap { background:#f6f2eb; min-height: calc(100vh - 64px); padding: 36px 16px; }
    .card { max-width: 900px; background:#fff; border:1px solid #eadcc8; border-radius: 14px; padding: 28px; box-shadow: 0 8px 30px rgba(0,0,0,.05); }
    .back-link { color:#8a5a00; text-decoration:none; font-weight:600; }
    h1 { margin: 12px 0 16px; color:#1f3c68; }
    p { color:#30435f; line-height:1.8; margin: 0; }
  `]
})
export class PolicyPageComponent {
  title = '';
  description = '';

  constructor(private route: ActivatedRoute) {
    const type = this.route.snapshot.params['type'] || '';
    const map: Record<string, { title: string; description: string }> = {
      privacy: {
        title: 'Privacy Policy',
        description: 'We collect only the minimum customer information required to process orders and provide support. Your personal information is never sold to third parties.'
      },
      shipping: {
        title: 'Shipping Policy',
        description: 'We dispatch orders quickly and share tracking updates as soon as your order is shipped. Delivery timelines vary based on location and courier service.'
      },
      refund: {
        title: 'Refund Policy',
        description: 'Refunds are processed for eligible returns after product verification. Refund timelines depend on payment method and bank processing time.'
      },
      terms: {
        title: 'Terms of Service',
        description: 'By shopping with Beauty Textile, you agree to our order, delivery, exchange, and support terms. We reserve the right to update policies for better service.'
      }
    };

    const fallback = {
      title: 'Policy',
      description: 'This page contains important policy information for Beauty Textile customers.'
    };

    const data = map[type] || fallback;
    this.title = data.title;
    this.description = data.description;
  }
}
