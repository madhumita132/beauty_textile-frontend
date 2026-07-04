import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-about-us',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NavbarComponent],
  template: `
    <app-navbar />
    <section class="page-wrap">
      <div class="container card">
        <a routerLink="/" class="back-link">← Back to Home</a>
        <h1>About Beauty Textile</h1>
        <p>
          Beauty Textile began as a small family business in 2008. With consistent quality,
          honest pricing, and customer-first service, we steadily grew from a small setup
          into a trusted textile destination in Aruppukottai.
        </p>
        <p>
          Today, we proudly run a larger super textile shop with collections for women,
          men, and kids. From daily wear to festive styles, our focus is to deliver
          elegant designs, reliable quality, and warm service every day.
        </p>
        <p>
          The trust of our customers is our biggest strength. We continue to expand our
          collections and service with the same values that started our journey: quality,
          transparency, and care.
        </p>
      </div>
    </section>
  `,
  styles: [`
    .page-wrap { background:#f6f2eb; min-height: calc(100vh - 64px); padding: 36px 16px; }
    .card { max-width: 900px; background:#fff; border:1px solid #eadcc8; border-radius: 14px; padding: 28px; box-shadow: 0 8px 30px rgba(0,0,0,.05); }
    .back-link { color:#8a5a00; text-decoration:none; font-weight:600; }
    h1 { margin: 12px 0 16px; color:#1f3c68; }
    p { color:#30435f; line-height:1.8; margin: 0 0 14px; }
  `]
})
export class AboutUsComponent {}
