import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../../../services/cart.service';
import { OrderService } from '../../../services/order.service';
import { ToastService } from '../../../services/toast.service';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { environment } from '../../../../environments/environment';

declare const Razorpay: any;

@Component({
  selector: 'app-checkout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, NavbarComponent, DecimalPipe],
  template: `
    <app-navbar />
    <div class="container" style="padding: 32px 16px 48px;">
      <h1 class="page-title">Checkout</h1>
      @if (cart.count() === 0) {
        <div class="empty-state">
          Cart is empty. <a routerLink="/products">Continue shopping</a>
        </div>
      } @else {
        <div class="checkout-layout">
          <!-- Customer details -->
          <div class="checkout-form card" style="padding:24px;flex:1;">
            <h2 class="section-h2">Customer Details</h2>
            <div class="form-group">
              <label class="form-label">Full Name *</label>
              <input [(ngModel)]="name" class="form-control" placeholder="Your name" />
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number *</label>
              <input [(ngModel)]="phone" class="form-control" placeholder="10-digit mobile" maxlength="10" />
            </div>
            <div class="form-group">
              <label class="form-label">Address</label>
              <textarea [(ngModel)]="address" class="form-control" rows="3" placeholder="Delivery address"></textarea>
            </div>
          </div>

          <!-- Order summary -->
          <div class="checkout-summary card" style="padding:24px;width:300px;flex-shrink:0;">
            <h2 class="section-h2">Order Summary</h2>
            @for (item of cart.items(); track item.product.id) {
              <div class="sum-row">
                <span>{{ item.product.name }} × {{ item.quantity }}</span>
                <span>₹{{ (item.product.price * item.quantity) | number:'1.0-0' }}</span>
              </div>
            }
            <div class="sum-total">
              <span>Total</span>
              <span>₹{{ cart.total() | number:'1.0-0' }}</span>
            </div>
            <button class="btn btn-primary btn-block mt-16" (click)="placeOrder()" [disabled]="placing">
              {{ placing ? 'Processing...' : 'Pay ₹' + (cart.total() | number:'1.0-0') }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-title { font-size: 1.6rem; font-weight: 700; margin-bottom: 24px; }
    .section-h2 { font-size: 1.1rem; font-weight: 700; margin-bottom: 20px; }
    .checkout-layout { display: flex; gap: 32px; flex-wrap: wrap; align-items: flex-start; }
    .sum-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: .9rem; }
    .sum-total { display: flex; justify-content: space-between; font-weight: 700; font-size: 1rem; border-top: 1px solid #ecf0f1; padding-top: 12px; margin-top: 12px; }
    .empty-state { text-align: center; color: #7f8c8d; padding: 60px; font-size: 1.1rem; }
    @media (max-width: 600px) { .checkout-summary { width: 100%; } }
  `]
})
export class CheckoutComponent {
  name = '';
  phone = '';
  address = '';
  placing = false;

  constructor(
    public cart: CartService,
    private orderSvc: OrderService,
    private http: HttpClient,
    private toast: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  placeOrder(): void {
    if (!this.name.trim() || !this.phone.trim()) {
      this.toast.error('Please fill name and phone number');
      return;
    }
    if (!/^\d{10}$/.test(this.phone)) {
      this.toast.error('Enter a valid 10-digit phone number');
      return;
    }
    this.placing = true;

    const orderReq = {
      customerName: this.name.trim(),
      phone: this.phone.trim(),
      address: this.address.trim(),
      items: this.cart.items().map(i => ({ productId: i.product.id, quantity: i.quantity }))
    };

    // Step 1: create the order (stock reserved)
    this.orderSvc.create(orderReq).subscribe({
      next: order => {
        // Step 2: create Razorpay payment order
        this.http.post<any>(`${environment.apiUrl}/payment/create`, { amount: order.totalAmount, orderId: order.id })
          .subscribe({
            next: payment => {
              if (payment.mock) {
                // Mock mode: skip Razorpay popup, verify directly
                this.http.post(`${environment.apiUrl}/payment/verify`, {
                  orderId: order.id,
                  razorpayOrderId: payment.razorpayOrderId,
                  razorpayPaymentId: 'mock_pay_' + Date.now(),
                  razorpaySignature: 'mock_sig'
                }).subscribe({
                  next: () => {
                    this.placing = false;
                    this.cart.clear();
                    this.cdr.markForCheck();
                    this.router.navigate(['/order-confirmation', order.id]);
                  },
                  error: () => { this.placing = false; this.toast.error('Payment verification failed'); this.cdr.markForCheck(); }
                });
              } else {
                this.openRazorpay(payment, order.id);
              }
            },
            error: () => { this.placing = false; this.toast.error('Payment initialization failed'); this.cdr.markForCheck(); }
          });
      },
      error: err => {
        this.placing = false;
        this.cdr.markForCheck();
        this.toast.error(err.error?.message || 'Failed to place order');
      }
    });
  }

  private openRazorpay(payment: any, orderId: number): void {
    const options = {
      key: payment.keyId,
      amount: payment.amount * 100,
      currency: payment.currency,
      name: 'Beauty Textile',
      description: 'Order Payment',
      order_id: payment.razorpayOrderId,
      handler: (response: any) => {
        this.http.post(`${environment.apiUrl}/payment/verify`, {
          orderId,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature
        }).subscribe({
          next: () => {
            this.placing = false;
            this.cart.clear();
            this.router.navigate(['/order-confirmation', orderId]);
          },
          error: () => { this.placing = false; this.toast.error('Payment verification failed'); }
        });
      },
      prefill: { name: this.name, contact: this.phone },
      theme: { color: '#c0392b' },
      modal: { ondismiss: () => { this.placing = false; } }
    };
    const rzp = new Razorpay(options);
    rzp.open();
  }
}
