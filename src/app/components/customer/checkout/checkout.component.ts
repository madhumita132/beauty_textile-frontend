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

    @if (showUpiModal) {
      <div class="upi-overlay" (click)="closeUpiModal()">
        <div class="upi-modal" (click)="$event.stopPropagation()">
          <button class="upi-close" type="button" (click)="closeUpiModal()">×</button>
          <h2 class="upi-title">Scan & Pay</h2>
          <p class="upi-subtitle">Use any UPI app to complete payment</p>

          <div class="upi-qr-wrap">
            <a [href]="upiPaymentLink" class="upi-open-link" title="Open UPI app">
              <img [src]="upiQrUrl" alt="UPI QR" class="upi-qr" />
            </a>
          </div>

          <div class="upi-amount">Amount: ₹{{ upiAmount | number:'1.0-2' }}</div>
          <div class="upi-id">UPI ID: {{ upiId }}</div>

          <div class="upi-actions">
            <a class="btn btn-outline" [href]="upiPaymentLink">Open UPI App</a>
            <button class="btn btn-outline" type="button" (click)="closeUpiModal()" [disabled]="confirmingUpi">Cancel</button>
            <button class="btn btn-primary" type="button" (click)="confirmUpiPaid()" [disabled]="confirmingUpi">
              {{ confirmingUpi ? 'Verifying...' : 'I Have Paid' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-title { font-size: 1.6rem; font-weight: 700; margin-bottom: 24px; }
    .section-h2 { font-size: 1.1rem; font-weight: 700; margin-bottom: 20px; }
    .checkout-layout { display: flex; gap: 32px; flex-wrap: wrap; align-items: flex-start; }
    .sum-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: .9rem; }
    .sum-total { display: flex; justify-content: space-between; font-weight: 700; font-size: 1rem; border-top: 1px solid #ecf0f1; padding-top: 12px; margin-top: 12px; }
    .empty-state { text-align: center; color: #7f8c8d; padding: 60px; font-size: 1.1rem; }
    .upi-overlay {
      position: fixed;
      inset: 0;
      background: rgba(9, 16, 28, .65);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 18px;
      z-index: 1200;
    }
    .upi-modal {
      width: 100%;
      max-width: 440px;
      background: #f8f8f8;
      border-radius: 22px;
      padding: 22px 22px 20px;
      position: relative;
      box-shadow: 0 18px 48px rgba(0, 0, 0, .35);
      text-align: center;
    }
    .upi-close {
      position: absolute;
      top: 8px;
      right: 10px;
      border: none;
      background: transparent;
      font-size: 28px;
      color: #666;
      cursor: pointer;
      line-height: 1;
    }
    .upi-title { margin: 0; font-size: 1.55rem; color: #1c2745; }
    .upi-subtitle { margin: 8px 0 16px; color: #5f6d8b; font-size: .93rem; }
    .upi-qr-wrap {
      background: #ffffff;
      border-radius: 16px;
      padding: 12px;
      border: 1px solid #ebedf1;
    }
    .upi-qr { width: 100%; max-width: 360px; aspect-ratio: 1 / 1; object-fit: contain; border-radius: 10px; }
    .upi-open-link { display: inline-block; }
    .upi-amount { margin-top: 14px; font-size: 1.05rem; font-weight: 700; color: #111827; }
    .upi-id { margin-top: 4px; font-size: .95rem; color: #4b5563; }
    .upi-actions {
      margin-top: 16px;
      display: flex;
      gap: 10px;
      justify-content: center;
    }
    @media (max-width: 600px) { .checkout-summary { width: 100%; } }
  `]
})
export class CheckoutComponent {
  name = '';
  phone = '';
  address = '';
  placing = false;
  showUpiModal = false;
  confirmingUpi = false;
  upiAmount = 0;
  currentOrderId: number | null = null;
  currentPaymentRef = '';

  private readonly upiPayeeName = 'Beauty Textile';
  readonly upiId = 'mithramadhu13-1@okhdfcbank';

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
        // Step 2: create payment reference on backend
        this.http.post<any>(`${environment.apiUrl}/payment/create`, { amount: order.totalAmount, orderId: order.id })
          .subscribe({
            next: payment => {
              this.currentOrderId = order.id;
              this.currentPaymentRef = payment?.razorpayOrderId || ('upi_ref_' + Date.now());
              this.upiAmount = Number(order.totalAmount || 0);
              this.showUpiModal = true;
              this.placing = false;
              this.cdr.markForCheck();
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

  closeUpiModal(): void {
    if (this.confirmingUpi) return;
    this.showUpiModal = false;
    this.cdr.markForCheck();
  }

  confirmUpiPaid(): void {
    if (!this.currentOrderId || this.confirmingUpi) {
      return;
    }

    this.confirmingUpi = true;
    this.http.post(`${environment.apiUrl}/payment/verify`, {
      orderId: this.currentOrderId,
      razorpayOrderId: this.currentPaymentRef,
      razorpayPaymentId: 'upi_pay_' + Date.now(),
      razorpaySignature: 'manual_upi_confirmed'
    }).subscribe({
      next: () => {
        const id = this.currentOrderId as number;
        this.confirmingUpi = false;
        this.showUpiModal = false;
        this.cart.clear();
        this.cdr.markForCheck();
        this.router.navigate(['/order-confirmation', id]);
      },
      error: () => {
        this.confirmingUpi = false;
        this.toast.error('Payment verification failed. Please try again.');
        this.cdr.markForCheck();
      }
    });
  }

  get upiQrUrl(): string {
    const upiLink = this.upiPaymentLink;
    return `https://api.qrserver.com/v1/create-qr-code/?size=420x420&margin=8&data=${encodeURIComponent(upiLink)}`;
  }

  get upiPaymentLink(): string {
    const params = new URLSearchParams({
      pa: this.upiId,
      pn: this.upiPayeeName,
      am: this.upiAmount.toFixed(2),
      cu: 'INR',
      tn: `Beauty Textile Order ${this.currentOrderId || ''}`.trim()
    });
    return `upi://pay?${params.toString()}`;
  }
}
