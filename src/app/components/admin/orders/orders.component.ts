import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../services/order.service';
import { Order } from '../../../models/models';

@Component({
  selector: 'app-orders',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, FormsModule],
  template: `
    <h1 class="admin-page-title">Online Orders</h1>
    @if (loading) {
      <div class="spinner"></div>
    } @else if (orders.length === 0) {
      <p class="text-muted">No orders yet.</p>
    } @else {
      <div class="table-wrap card">
        <table>
          <thead><tr>
            <th>#</th><th>Customer</th><th>Phone</th><th>Total</th>
            <th>Payment</th><th>Fulfilment</th><th>Date</th><th>Address</th><th>Items</th>
          </tr></thead>
          <tbody>
            @for (o of orders; track o.id) {
              <tr>
                <td>{{ o.id }}</td>
                <td>{{ o.customerName }}</td>
                <td>{{ o.phone }}</td>
                <td>₹{{ o.totalAmount | number:'1.0-0' }}</td>
                <td><span [class]="payBadge(o.paymentStatus)">{{ o.paymentStatus }}</span></td>
                <td>
                  <!-- Dropdown to update fulfillment status (only for PAID orders) -->
                  @if (o.paymentStatus === 'PAID' || o.paymentStatus?.toString() === 'PAID') {
                    <select [value]="o.fulfillmentStatus || 'PENDING'"
                      (change)="updateFulfillment(o, $any($event.target).value)"
                      [class]="fulfillClass(o.fulfillmentStatus)">
                      @for (s of fulfillmentSteps; track s) {
                        <option [value]="s" [selected]="(o.fulfillmentStatus || 'PENDING') === s">{{ s }}</option>
                      }
                    </select>
                  } @else {
                    <span class="badge badge-warning">AWAITING PAYMENT</span>
                  }
                </td>
                <td>{{ o.createdAt | date:'dd/MM/yy HH:mm' }}</td>
                <td class="address-cell">{{ o.address }}</td>
                <td class="item-list">
                  @for (item of o.items; track item.productId) {
                    <div class="text-sm">{{ item.productName }} × {{ item.quantity }}</div>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: [`
    .admin-page-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 24px; }
    .text-sm { font-size: .8rem; color: #7f8c8d; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: .88rem; }
    th { text-align: left; padding: 10px 12px; border-bottom: 2px solid #f0f0f0; color: #666; white-space: nowrap; }
    td { padding: 10px 12px; border-bottom: 1px solid #f8f8f8; vertical-align: top; }
    tr:hover td { background: #fdf9f5; }
    .badge { display:inline-block; padding:3px 10px; border-radius:12px; font-size:.75rem; font-weight:700; }
    .badge-success { background:#d4edda; color:#155724; }
    .badge-warning { background:#fff3cd; color:#856404; }
    .badge-danger  { background:#f8d7da; color:#721c24; }
    .badge-info    { background:#cce5ff; color:#004085; }
    .fulfill-select { padding:4px 8px; border-radius:6px; border:1px solid #ddd; font-size:.82rem; cursor:pointer; }
    .fs-pending   { background:#fff3cd; color:#856404; border-color:#f5c842; }
    .fs-confirmed { background:#cce5ff; color:#004085; border-color:#b8daff; }
    .fs-packed    { background:#d4edda; color:#155724; border-color:#c3e6cb; }
    .fs-shipped   { background:#e2d9f3; color:#4a235a; border-color:#c9b8e8; }
    .fs-delivered { background:#d4edda; color:#155724; border-color:#28a745; font-weight:700; }
    .fs-null, .fs- { background:#f8f9fa; color:#555; }
    .item-list { line-height: 1.7; }
    .order-total { font-weight: 700; color: #805500; }
    .text-muted { color: #aaa; }
    .address-cell { max-width: 160px; font-size:.78rem; color:#666; white-space:pre-wrap; word-break:break-word; }
  `]
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  loading = true;
  readonly fulfillmentSteps = ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'];

  constructor(private orderSvc: OrderService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.orderSvc.getAll().subscribe({
      next: o => { this.orders = o; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  updateFulfillment(order: Order, status: string): void {
    this.orderSvc.updateFulfillment(order.id, status).subscribe({
      next: updated => {
        order.fulfillmentStatus = updated.fulfillmentStatus;
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  payBadge(s: string): string {
    const map: Record<string, string> = {
      PAID: 'badge badge-success', PENDING: 'badge badge-warning',
      FAILED: 'badge badge-danger', COD: 'badge badge-info'
    };
    return map[s] || 'badge';
  }

  fulfillClass(s: string): string {
    return 'fulfill-select fs-' + (s || 'pending').toLowerCase();
  }
}
