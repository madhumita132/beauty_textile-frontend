import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from '../../../services/order.service';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { Order } from '../../../models/models';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NavbarComponent, DecimalPipe],
  template: `
    <app-navbar />
    <div class="container confirm-wrap">
      <div class="confirm-card card">
        <div class="confirm-icon">✅</div>
        <h1>Order Confirmed!</h1>
        @if (order) {
          <p class="order-id">Order # <strong>{{ order.id }}</strong></p>
          <p>Thank you, <strong>{{ order.customerName }}</strong>!</p>
          <p class="text-muted">We'll process your order soon.</p>
          <div class="order-summary mt-16">
            @for (item of order.items; track item.productId) {
              <div class="sum-row">
                <span>{{ item.productName }} × {{ item.quantity }}</span>
                <span>₹{{ (item.price * item.quantity) | number:'1.0-0' }}</span>
              </div>
            }
            <div class="sum-total">
              <span>Total Paid</span>
              <span>₹{{ order.totalAmount | number:'1.0-0' }}</span>
            </div>
          </div>
        }
        <a routerLink="/" class="btn btn-primary mt-32">Continue Shopping</a>
      </div>
    </div>
  `,
  styles: [`
    .confirm-wrap { display: flex; justify-content: center; padding: 48px 16px; }
    .confirm-card { max-width: 480px; width: 100%; padding: 40px; text-align: center; }
    .confirm-icon { font-size: 4rem; margin-bottom: 16px; }
    h1 { font-size: 1.8rem; font-weight: 700; margin-bottom: 8px; }
    .order-id { font-size: 1rem; color: #7f8c8d; margin: 8px 0 16px; }
    .order-summary { text-align: left; margin-top: 16px; }
    .sum-row { display: flex; justify-content: space-between; font-size: .9rem; margin-bottom: 8px; }
    .sum-total { display: flex; justify-content: space-between; font-weight: 700; border-top: 1px solid #ecf0f1; padding-top: 10px; margin-top: 10px; }
  `]
})
export class OrderConfirmationComponent implements OnInit {
  order: Order | null = null;

  constructor(private route: ActivatedRoute, private orderSvc: OrderService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.orderSvc.getById(id).subscribe(o => { this.order = o; this.cdr.markForCheck(); });
  }
}
