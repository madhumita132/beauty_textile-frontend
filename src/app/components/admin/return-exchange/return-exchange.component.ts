import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReturnExchangeService } from '../../../services/return-exchange.service';
import { ProductService } from '../../../services/product.service';
import { ToastService } from '../../../services/toast.service';
import {
  Billing, ExchangeRecord, ExchangeRequest, Product, ReturnRecord, ReturnRequest
} from '../../../models/models';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

type MainTab = 'search' | 'return' | 'exchange' | 'history';

@Component({
  selector: 'app-return-exchange',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, DatePipe, DecimalPipe,
    MatIconModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDividerModule,
    MatTabsModule, MatTooltipModule
  ],
  template: `
    <h1 class="page-title">Exchange & Return Management</h1>

    <!-- Tabs -->
    <div class="tabs">
      <button [class.active]="tab==='search'"   (click)="tab='search'">
        <mat-icon>search</mat-icon> Search Bill
      </button>
      <button [class.active]="tab==='return'"   (click)="tab='return'"   [disabled]="!selectedBill">
        <mat-icon>assignment_return</mat-icon> Return
      </button>
      <button [class.active]="tab==='exchange'" (click)="tab='exchange'" [disabled]="!selectedBill">
        <mat-icon>swap_horiz</mat-icon> Exchange
      </button>
      <button [class.active]="tab==='history'"  (click)="tab='history'; loadHistory()">
        <mat-icon>history</mat-icon> History
      </button>
    </div>

    <!-- ════════ TAB 1 – Search Bill ════════ -->
    @if (tab === 'search') {
      <div class="section-card">
        <h2>Find Bill</h2>

        <div class="search-row">
          <!-- By Bill ID -->
          <div class="search-box">
            <label class="form-label">Bill Number</label>
            <div class="input-btn-row">
              <input [(ngModel)]="searchBillId" type="number" class="form-control" placeholder="e.g. 1042" />
              <button mat-raised-button (click)="searchById()" class="btn-brown">Search</button>
            </div>
          </div>

          <!-- By Phone -->
          <div class="search-box">
            <label class="form-label">Mobile Number</label>
            <div class="input-btn-row">
              <input [(ngModel)]="searchPhone" class="form-control" placeholder="10-digit" maxlength="10" />
              <button mat-raised-button (click)="searchByPhone()" class="btn-brown">Search</button>
            </div>
          </div>

          <!-- By Date -->
          <div class="search-box">
            <label class="form-label">Date</label>
            <div class="input-btn-row">
              <input [(ngModel)]="searchDate" type="date" class="form-control" />
              <button mat-raised-button (click)="searchByDate()" class="btn-brown">Search</button>
            </div>
          </div>
        </div>

        @if (searching) { <p class="hint-text">Searching...</p> }
        @if (!searching && searchResults.length === 0 && searchDone) {
          <p class="empty-msg">No bills found.</p>
        }

        <!-- Results list -->
        @for (bill of searchResults; track bill.id) {
          <div class="bill-card" [class.selected]="selectedBill?.id === bill.id"
               (click)="selectBill(bill)">
            <div class="bill-card-header">
              <span class="bill-id">#{{ bill.id }}</span>
              <span class="bill-status status-{{ bill.status?.toLowerCase() }}">
                {{ bill.status || 'ACTIVE' }}
              </span>
              <span class="bill-date">{{ bill.createdAt | date:'dd/MM/yy HH:mm' }}</span>
              <span class="bill-amount">₹{{ (bill.finalAmount || bill.totalAmount) | number:'1.0-0' }}</span>
            </div>
            @if (bill.customerName) { <div class="text-muted text-sm">{{ bill.customerName }}
              @if (bill.phone) { · {{ bill.phone }} }
            </div> }
            <div class="bill-items-preview">
              @for (item of bill.items; track item.productId) {
                <span class="item-chip">{{ item.productName }} ×{{ item.quantity }}</span>
              }
            </div>
          </div>
        }
      </div>
    }

    <!-- ════════ TAB 2 – Return ════════ -->
    @if (tab === 'return' && selectedBill) {
      <div class="section-card">
        <div class="selected-bill-banner">
          <mat-icon>receipt</mat-icon>
          Bill #{{ selectedBill.id }} — {{ selectedBill.customerName || 'Walk-in' }}
          &nbsp;|&nbsp; ₹{{ (selectedBill.finalAmount || selectedBill.totalAmount) | number:'1.0-0' }}
          &nbsp;|&nbsp; {{ selectedBill.createdAt | date:'dd/MM/yyyy' }}
          <button mat-icon-button (click)="clearSelectedBill()" class="close-btn" matTooltip="Change bill">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div class="two-col" style="margin-top:20px">
          <mat-form-field appearance="outline" style="flex:1">
            <mat-label>Return Type</mat-label>
            <mat-select [(ngModel)]="returnType">
              <mat-option value="FULL">Full Return (all items)</mat-option>
              <mat-option value="PARTIAL">Partial Return (select items)</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" style="flex:1">
            <mat-label>Refund Method</mat-label>
            <mat-select [(ngModel)]="refundMethod">
              <mat-option value="CASH">Cash Refund</mat-option>
              <mat-option value="STORE_CREDIT">Store Credit</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Return Reason</mat-label>
          <input matInput [(ngModel)]="returnReason" placeholder="e.g. Defective product, size issue" />
        </mat-form-field>

        <!-- Partial: choose items -->
        @if (returnType === 'PARTIAL') {
          <h3 class="sub-title">Select Items to Return</h3>
          @for (item of selectedBill.items; track item.productId) {
            <div class="item-return-row">
              <mat-icon class="item-icon">checkroom</mat-icon>
              <div class="item-info">
                <div class="item-name">{{ item.productName }}</div>
                <div class="text-muted text-sm">₹{{ item.price }} × {{ item.quantity }} purchased</div>
              </div>
              <div class="qty-controls">
                <label class="form-label" style="font-size:.75rem;margin:0">Return qty</label>
                <input type="number" class="form-control qty-input"
                  [max]="item.quantity" min="0"
                  [(ngModel)]="returnQtys[item.productId]" />
              </div>
            </div>
          }
        }

        <!-- Refund preview -->
        <div class="refund-preview">
          <mat-icon>currency_rupee</mat-icon>
          <span>Estimated Refund: <strong>₹{{ estimatedRefund | number:'1.0-0' }}</strong></span>
          <span class="text-muted text-sm">via {{ refundMethod }}</span>
        </div>

        <button mat-raised-button class="btn-brown btn-lg" [disabled]="saving"
          (click)="submitReturn()">
          {{ saving ? 'Processing...' : '✅ Confirm Return' }}
        </button>
      </div>
    }

    <!-- ════════ TAB 3 – Exchange ════════ -->
    @if (tab === 'exchange' && selectedBill) {
      <div class="section-card">
        <div class="selected-bill-banner">
          <mat-icon>receipt</mat-icon>
          Bill #{{ selectedBill.id }} — {{ selectedBill.customerName || 'Walk-in' }}
          &nbsp;|&nbsp; {{ selectedBill.createdAt | date:'dd/MM/yyyy' }}
          <button mat-icon-button (click)="clearSelectedBill()" class="close-btn" matTooltip="Change bill">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div class="exchange-layout" style="margin-top:20px">
          <!-- LEFT – Old product -->
          <div class="exchange-panel old-panel">
            <h3 class="panel-title"><mat-icon>remove_shopping_cart</mat-icon> Returning Product</h3>
            <mat-form-field appearance="outline" style="width:100%">
              <mat-label>Select item from bill</mat-label>
              <mat-select [(ngModel)]="exOldProductId" (ngModelChange)="onOldProductChange()">
                @for (item of selectedBill.items; track item.productId) {
                  <mat-option [value]="item.productId">
                    {{ item.productName }} — ₹{{ item.price }} (×{{ item.quantity }})
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>
            @if (exOldProductId) {
              <div class="price-box old-price">
                ₹{{ exOldPrice | number:'1.0-0' }}
                @if (exOldQty > 1) { × {{ exOldQty }} = ₹{{ (exOldPrice * exOldQty) | number:'1.0-0' }} }
              </div>
              <div class="qty-row">
                <label class="form-label">Quantity returning</label>
                <input type="number" class="form-control qty-input" [(ngModel)]="exOldQty"
                  min="1" [max]="exOldMaxQty" />
              </div>
            }
          </div>

          <div class="exchange-arrow"><mat-icon>swap_horiz</mat-icon></div>

          <!-- RIGHT – New product -->
          <div class="exchange-panel new-panel">
            <h3 class="panel-title"><mat-icon>add_shopping_cart</mat-icon> New Product</h3>
            <mat-form-field appearance="outline" style="width:100%">
              <mat-label>Select new product</mat-label>
              <mat-select [(ngModel)]="exNewProductId" (ngModelChange)="onNewProductChange()">
                @for (p of allProducts; track p.id) {
                  @if (p.stock > 0) {
                    <mat-option [value]="p.id">
                      {{ p.name }} — ₹{{ p.finalPrice ?? p.price }} (stock: {{ p.stock }})
                    </mat-option>
                  }
                }
              </mat-select>
            </mat-form-field>
            @if (exNewProductId) {
              <div class="price-box new-price">
                ₹{{ exNewPrice | number:'1.0-0' }}
                @if (exNewQty > 1) { × {{ exNewQty }} = ₹{{ (exNewPrice * exNewQty) | number:'1.0-0' }} }
              </div>
              <div class="qty-row">
                <label class="form-label">Quantity</label>
                <input type="number" class="form-control qty-input" [(ngModel)]="exNewQty" min="1" />
              </div>
            }
          </div>
        </div>

        <!-- Difference summary -->
        @if (exOldProductId && exNewProductId) {
          <div class="diff-summary" [class.pay]="exDiff > 0" [class.refund]="exDiff < 0" [class.even]="exDiff === 0">
            @if (exDiff > 0) {
              <mat-icon>arrow_upward</mat-icon>
              <span>Customer pays <strong>₹{{ exDiff | number:'1.0-0' }}</strong> extra</span>
            } @else if (exDiff < 0) {
              <mat-icon>arrow_downward</mat-icon>
              <span>Shop refunds <strong>₹{{ -exDiff | number:'1.0-0' }}</strong></span>
              <mat-form-field appearance="outline" style="margin-left:12px;width:180px">
                <mat-label>Via</mat-label>
                <mat-select [(ngModel)]="exRefundMethod">
                  <mat-option value="CASH">Cash</mat-option>
                  <mat-option value="STORE_CREDIT">Store Credit</mat-option>
                </mat-select>
              </mat-form-field>
            } @else {
              <mat-icon>check_circle</mat-icon>
              <span>Equal exchange — no payment needed</span>
            }
          </div>

          <mat-form-field appearance="outline" style="width:100%;margin-top:12px">
            <mat-label>Exchange Reason</mat-label>
            <input matInput [(ngModel)]="exchangeReason" placeholder="e.g. Size doesn't fit" />
          </mat-form-field>

          <button mat-raised-button class="btn-brown btn-lg" [disabled]="saving"
            (click)="submitExchange()">
            {{ saving ? 'Processing...' : '🔄 Confirm Exchange' }}
          </button>
        }
      </div>
    }

    <!-- ════════ TAB 4 – History ════════ -->
    @if (tab === 'history') {
      <div class="section-card">
        <!-- Month filter + stats -->
        <div class="history-header">
          <h2>Return & Exchange History</h2>
          <div class="month-pick">
            <input type="month" class="form-control" [(ngModel)]="statsMonth"
              (change)="loadMonthlyStats()" style="width:160px" />
          </div>
        </div>

        @if (monthStats) {
          <div class="stats-row">
            <div class="stat-box">
              <div class="stat-val">{{ monthStats.totalReturns }}</div>
              <div class="stat-lbl">Returns</div>
            </div>
            <div class="stat-box">
              <div class="stat-val">{{ monthStats.totalExchanges }}</div>
              <div class="stat-lbl">Exchanges</div>
            </div>
            <div class="stat-box warn">
              <div class="stat-val">₹{{ monthStats.totalRefunds | number:'1.0-0' }}</div>
              <div class="stat-lbl">Total Refunds</div>
            </div>
          </div>
        }

        <mat-divider style="margin:20px 0"></mat-divider>

        <!-- Returns list -->
        <h3 class="sub-title">Returns ({{ allReturns.length }})</h3>
        @for (r of allReturns; track r.id) {
          <div class="history-card return-card">
            <div class="hc-left">
              <mat-icon class="hc-icon">assignment_return</mat-icon>
            </div>
            <div class="hc-body">
              <div class="hc-title">Return #{{ r.id }} · Bill #{{ r.billId }}</div>
              <div class="text-muted text-sm">
                {{ r.returnDate | date:'dd/MM/yyyy HH:mm' }}
                @if (r.processedBy) { · by {{ r.processedBy }} }
              </div>
              <div class="hc-meta">
                <span class="badge-type {{ r.returnType.toLowerCase() }}">{{ r.returnType }}</span>
                @if (r.customerName) { <span>{{ r.customerName }}</span> }
                <span class="refund-amt">Refund: ₹{{ r.refundAmount | number:'1.0-0' }} ({{ r.refundMethod }})</span>
              </div>
              @if (r.returnReason) { <div class="hc-reason">Reason: {{ r.returnReason }}</div> }
              <div class="hc-items">
                @for (i of r.items; track i.productId) {
                  <span class="item-chip">{{ i.productName }} ×{{ i.quantity }}</span>
                }
              </div>
            </div>
          </div>
        }
        @if (allReturns.length === 0) { <p class="empty-msg">No returns found.</p> }

        <mat-divider style="margin:20px 0"></mat-divider>

        <!-- Exchanges list -->
        <h3 class="sub-title">Exchanges ({{ allExchanges.length }})</h3>
        @for (e of allExchanges; track e.id) {
          <div class="history-card exchange-card">
            <div class="hc-left">
              <mat-icon class="hc-icon">swap_horiz</mat-icon>
            </div>
            <div class="hc-body">
              <div class="hc-title">Exchange #{{ e.id }} · Bill #{{ e.oldBillId }}</div>
              <div class="text-muted text-sm">
                {{ e.exchangeDate | date:'dd/MM/yyyy HH:mm' }}
                @if (e.processedBy) { · by {{ e.processedBy }} }
              </div>
              <div class="exchange-flow">
                <span class="old-item">{{ e.oldProductName }} ×{{ e.oldQuantity }} (₹{{ e.oldPrice }})</span>
                <mat-icon style="color:#805500">swap_horiz</mat-icon>
                <span class="new-item">{{ e.newProductName }} ×{{ e.newQuantity }} (₹{{ e.newPrice }})</span>
              </div>
              <div class="hc-meta">
                @if (e.priceDifference > 0) {
                  <span class="diff-pay">Customer paid ₹{{ e.priceDifference | number:'1.0-0' }}</span>
                } @else if (e.priceDifference < 0) {
                  <span class="diff-refund">Shop refunded ₹{{ -e.priceDifference | number:'1.0-0' }} ({{ e.refundMethod }})</span>
                } @else {
                  <span class="diff-even">Equal exchange</span>
                }
                @if (e.customerName) { <span>· {{ e.customerName }}</span> }
              </div>
              @if (e.exchangeReason) { <div class="hc-reason">Reason: {{ e.exchangeReason }}</div> }
            </div>
          </div>
        }
        @if (allExchanges.length === 0) { <p class="empty-msg">No exchanges found.</p> }
      </div>
    }
  `,
  styles: [`
    .page-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 20px; color: #2c1a00; }

    .tabs { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
    .tabs button { display: flex; align-items: center; gap: 6px; padding: 10px 18px; border-radius: 8px;
                   background: #f0e8d8; color: #3e2000; font-weight: 500; font-size: .9rem; border: none; cursor: pointer; }
    .tabs button.active { background: #805500; color: #fff; }
    .tabs button[disabled] { opacity: .45; cursor: default; }
    .tabs button mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .section-card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 12px rgba(128,85,0,.1); }
    h2 { font-size: 1.1rem; font-weight: 700; color: #2c1a00; margin: 0 0 16px; }
    .sub-title { font-size: .95rem; font-weight: 700; color: #3e2000; margin: 16px 0 8px; }
    .hint-text { color: #8a7560; font-size: .88rem; }
    .empty-msg { color: #8a7560; font-style: italic; padding: 8px 0; }
    .two-col { display: flex; gap: 16px; flex-wrap: wrap; }

    /* Search */
    .search-row { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 20px; }
    .search-box { flex: 1; min-width: 200px; }
    .input-btn-row { display: flex; gap: 8px; align-items: center; }
    .btn-brown { background: #805500 !important; color: #fff !important; }
    .btn-lg { height: 48px; min-width: 180px; font-size: .95rem; }
    .form-label { font-size: .82rem; font-weight: 600; color: #3e2000; display: block; margin-bottom: 4px; }
    .form-control { border: 1px solid #d4c4a8; border-radius: 6px; padding: 8px 12px; font-size: .9rem; width: 100%; }
    .form-control:focus { outline: none; border-color: #805500; }

    /* Bill cards */
    .bill-card { border: 2px solid #e0c898; border-radius: 10px; padding: 12px 16px; margin-bottom: 10px;
                 cursor: pointer; transition: .15s; }
    .bill-card:hover { border-color: #805500; background: #fdf9f5; }
    .bill-card.selected { border-color: #805500; background: #fdf7ee; }
    .bill-card-header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 4px; }
    .bill-id { font-weight: 700; font-size: 1rem; color: #2c1a00; }
    .bill-date { color: #8a7560; font-size: .82rem; }
    .bill-amount { font-weight: 700; color: #805500; margin-left: auto; }
    .bill-status { padding: 2px 8px; border-radius: 8px; font-size: .72rem; font-weight: 700; text-transform: uppercase; }
    .bill-status.status-active { background: #d5f5e3; color: #1a7a3c; }
    .bill-status.status-returned { background: #fdecea; color: #c62828; }
    .bill-status.status-partially_returned { background: #fff3cd; color: #856404; }
    .bill-items-preview { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
    .item-chip { background: #f0e8d8; color: #3e2000; padding: 2px 8px; border-radius: 10px; font-size: .75rem; }

    /* Selected bill banner */
    .selected-bill-banner { background: #f0e8d8; border-radius: 8px; padding: 12px 16px;
                             display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
                             font-weight: 600; color: #2c1a00; }
    .selected-bill-banner mat-icon { color: #805500; }
    .close-btn { margin-left: auto; }

    /* Return items */
    .item-return-row { display: flex; align-items: center; gap: 12px; padding: 10px 14px;
                       border: 1px solid #e0c898; border-radius: 8px; margin-bottom: 8px; }
    .item-icon { color: #805500; }
    .item-info { flex: 1; }
    .item-name { font-weight: 600; color: #2c1a00; }
    .qty-controls { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .qty-input { width: 70px; text-align: center; }
    .refund-preview { display: flex; align-items: center; gap: 10px; background: #d5f5e3;
                      border-radius: 8px; padding: 12px 16px; margin: 16px 0; color: #1a7a3c; font-weight: 600; }

    /* Exchange */
    .exchange-layout { display: flex; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
    .exchange-panel { flex: 1; min-width: 200px; background: #fdf9f5; border: 1px solid #e0c898;
                      border-radius: 10px; padding: 16px; }
    .old-panel { border-left: 4px solid #e74c3c; }
    .new-panel { border-left: 4px solid #27ae60; }
    .panel-title { display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: .9rem;
                   color: #2c1a00; margin-bottom: 12px; }
    .exchange-arrow { display: flex; align-items: center; padding-top: 60px; }
    .exchange-arrow mat-icon { font-size: 2rem; width: 2rem; height: 2rem; color: #805500; }
    .price-box { font-size: 1.5rem; font-weight: 800; padding: 8px 0; }
    .old-price { color: #e74c3c; }
    .new-price { color: #27ae60; }
    .qty-row { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
    .diff-summary { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-radius: 10px;
                    font-size: 1rem; margin-top: 16px; font-weight: 600; flex-wrap: wrap; }
    .diff-summary.pay    { background: #fdecea; color: #c62828; }
    .diff-summary.refund { background: #d5f5e3; color: #1a7a3c; }
    .diff-summary.even   { background: #e8f4fd; color: #1a4a7a; }

    /* History */
    .history-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
    .stats-row { display: flex; gap: 16px; flex-wrap: wrap; margin: 16px 0; }
    .stat-box { flex: 1; min-width: 120px; background: #f0e8d8; border-radius: 10px; padding: 16px; text-align: center; }
    .stat-box.warn { background: #fdecea; }
    .stat-val { font-size: 1.5rem; font-weight: 800; color: #2c1a00; }
    .stat-lbl { font-size: .8rem; color: #8a7560; margin-top: 4px; }
    .history-card { display: flex; gap: 12px; padding: 14px 16px; border-radius: 10px;
                    border: 1px solid #e0c898; margin-bottom: 10px; }
    .return-card   { border-left: 4px solid #e74c3c; }
    .exchange-card { border-left: 4px solid #805500; }
    .hc-left { display: flex; align-items: flex-start; padding-top: 2px; }
    .hc-icon { color: #805500; }
    .hc-body { flex: 1; }
    .hc-title { font-weight: 700; color: #2c1a00; }
    .hc-meta  { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: 4px 0; font-size: .85rem; }
    .hc-reason { font-size: .8rem; color: #8a7560; font-style: italic; margin-top: 2px; }
    .hc-items  { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
    .badge-type { padding: 2px 8px; border-radius: 8px; font-size: .72rem; font-weight: 700; text-transform: uppercase; }
    .badge-type.full    { background: #fdecea; color: #c62828; }
    .badge-type.partial { background: #fff3cd; color: #856404; }
    .refund-amt  { font-weight: 700; color: #c62828; }
    .exchange-flow { display: flex; align-items: center; gap: 8px; margin: 4px 0; flex-wrap: wrap; }
    .old-item  { color: #e74c3c; font-weight: 600; }
    .new-item  { color: #27ae60; font-weight: 600; }
    .diff-pay    { color: #c62828; font-weight: 700; }
    .diff-refund { color: #27ae60; font-weight: 700; }
    .diff-even   { color: #8a7560; }

    @media (max-width: 700px) {
      .exchange-layout { flex-direction: column; }
      .exchange-arrow { padding-top: 0; justify-content: center; }
    }
  `]
})
export class ReturnExchangeComponent implements OnInit {
  tab: MainTab = 'search';

  // ── Search state ────────────────────────────────────────────────────────
  searchBillId: number | null = null;
  searchPhone = '';
  searchDate = '';
  searchResults: Billing[] = [];
  searching = false;
  searchDone = false;

  selectedBill: Billing | null = null;

  // ── Return state ────────────────────────────────────────────────────────
  returnType: 'FULL' | 'PARTIAL' = 'FULL';
  refundMethod: 'CASH' | 'STORE_CREDIT' = 'CASH';
  returnReason = '';
  returnQtys: Record<number, number> = {};

  // ── Exchange state ──────────────────────────────────────────────────────
  allProducts: Product[] = [];
  exOldProductId: number | null = null;
  exOldPrice = 0;
  exOldQty = 1;
  exOldMaxQty = 1;
  exNewProductId: number | null = null;
  exNewPrice = 0;
  exNewQty = 1;
  exRefundMethod: 'CASH' | 'STORE_CREDIT' = 'CASH';
  exchangeReason = '';

  // ── History ─────────────────────────────────────────────────────────────
  allReturns: ReturnRecord[] = [];
  allExchanges: ExchangeRecord[] = [];
  statsMonth = new Date().toISOString().slice(0, 7);
  monthStats: { totalReturns: number; totalExchanges: number; totalRefunds: number } | null = null;

  saving = false;

  get estimatedRefund(): number {
    if (!this.selectedBill) return 0;
    if (this.returnType === 'FULL') {
      return +(this.selectedBill.finalAmount || this.selectedBill.totalAmount);
    }
    let total = 0;
    for (const item of this.selectedBill.items) {
      const qty = this.returnQtys[item.productId] || 0;
      total += item.price * qty;
    }
    return total;
  }

  get exDiff(): number {
    const oldTotal = this.exOldPrice * this.exOldQty;
    const newTotal = this.exNewPrice * this.exNewQty;
    return Math.round((newTotal - oldTotal) * 100) / 100;
  }

  constructor(
    private svc: ReturnExchangeService,
    private productSvc: ProductService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.productSvc.getAll().subscribe(p => { this.allProducts = p; this.cdr.markForCheck(); });

    // Support direct link: /admin/returns?billId=123
    this.route.queryParams.subscribe(params => {
      if (params['billId']) {
        this.searchBillId = +params['billId'];
        this.searchById();
      }
    });
  }

  // ── Search ───────────────────────────────────────────────────────────────

  searchById(): void {
    if (!this.searchBillId) return;
    this.searching = true;
    this.svc.getBillById(this.searchBillId).subscribe({
      next: bill => {
        this.searchResults = [bill];
        this.searching = false;
        this.searchDone = true;
        this.cdr.markForCheck();
      },
      error: () => {
        this.searchResults = [];
        this.searching = false;
        this.searchDone = true;
        this.toast.error('Bill not found');
        this.cdr.markForCheck();
      }
    });
  }

  searchByPhone(): void {
    if (!this.searchPhone) return;
    this.searching = true;
    this.svc.getBillsByPhone(this.searchPhone).subscribe({
      next: bills => {
        this.searchResults = bills;
        this.searching = false;
        this.searchDone = true;
        this.cdr.markForCheck();
      },
      error: () => { this.searching = false; this.cdr.markForCheck(); }
    });
  }

  searchByDate(): void {
    if (!this.searchDate) return;
    this.searching = true;
    this.svc.getBillsByDate(this.searchDate).subscribe({
      next: bills => {
        this.searchResults = bills;
        this.searching = false;
        this.searchDone = true;
        this.cdr.markForCheck();
      },
      error: () => { this.searching = false; this.cdr.markForCheck(); }
    });
  }

  selectBill(bill: Billing): void {
    this.selectedBill = bill;
    this.returnQtys = {};
    bill.items.forEach(i => this.returnQtys[i.productId] = i.quantity);
    this.tab = 'return';
    this.cdr.markForCheck();
  }

  clearSelectedBill(): void {
    this.selectedBill = null;
    this.tab = 'search';
    this.exOldProductId = null;
    this.exNewProductId = null;
    this.cdr.markForCheck();
  }

  // ── Return ───────────────────────────────────────────────────────────────

  submitReturn(): void {
    if (!this.selectedBill) return;
    const items = this.buildReturnItems();
    if (items.length === 0) { this.toast.error('Select at least one item to return'); return; }

    this.saving = true;
    const req: ReturnRequest = {
      billId: this.selectedBill.id,
      returnType: this.returnType,
      returnReason: this.returnReason,
      refundMethod: this.refundMethod,
      processedBy: 'admin',
      itemsToReturn: items
    };

    this.svc.processReturn(req).subscribe({
      next: r => {
        this.saving = false;
        this.toast.success(`Return #${r.id} processed! Refund ₹${r.refundAmount} (${r.refundMethod})`);
        // update bill status in the search results
        if (this.selectedBill) {
          this.selectedBill.status = this.returnType === 'FULL' ? 'RETURNED' : 'PARTIALLY_RETURNED';
        }
        this.tab = 'search';
        this.cdr.markForCheck();
      },
      error: err => {
        this.saving = false;
        this.toast.error(err.error?.message || 'Return failed');
        this.cdr.markForCheck();
      }
    });
  }

  private buildReturnItems() {
    if (!this.selectedBill) return [];
    if (this.returnType === 'FULL') {
      return this.selectedBill.items.map(i => ({
        productId: i.productId, productName: i.productName, quantity: i.quantity, price: i.price
      }));
    }
    return this.selectedBill.items
      .filter(i => (this.returnQtys[i.productId] || 0) > 0)
      .map(i => ({
        productId: i.productId, productName: i.productName,
        quantity: this.returnQtys[i.productId], price: i.price
      }));
  }

  // ── Exchange ─────────────────────────────────────────────────────────────

  onOldProductChange(): void {
    if (!this.selectedBill || !this.exOldProductId) return;
    const item = this.selectedBill.items.find(i => i.productId === this.exOldProductId);
    if (item) {
      this.exOldPrice = item.price;
      this.exOldMaxQty = item.quantity;
      this.exOldQty = 1;
    }
    this.cdr.markForCheck();
  }

  onNewProductChange(): void {
    if (!this.exNewProductId) return;
    const p = this.allProducts.find(x => x.id === this.exNewProductId);
    if (p) { this.exNewPrice = +(p.finalPrice ?? p.price); }
    this.cdr.markForCheck();
  }

  submitExchange(): void {
    if (!this.selectedBill || !this.exOldProductId || !this.exNewProductId) return;

    this.saving = true;
    const req: ExchangeRequest = {
      oldBillId: this.selectedBill.id,
      oldProductId: this.exOldProductId,
      oldQuantity: this.exOldQty,
      newProductId: this.exNewProductId,
      newQuantity: this.exNewQty,
      refundMethod: this.exRefundMethod,
      exchangeReason: this.exchangeReason,
      processedBy: 'admin'
    };

    this.svc.processExchange(req).subscribe({
      next: e => {
        this.saving = false;
        const diffMsg = e.priceDifference > 0
          ? `Customer pays ₹${e.priceDifference}`
          : e.priceDifference < 0
            ? `Refund ₹${Math.abs(e.priceDifference)} via ${e.refundMethod}`
            : 'Equal exchange';
        this.toast.success(`Exchange #${e.id} done! ${diffMsg}`);
        this.exOldProductId = null;
        this.exNewProductId = null;
        this.tab = 'search';
        this.cdr.markForCheck();
      },
      error: err => {
        this.saving = false;
        this.toast.error(err.error?.message || 'Exchange failed');
        this.cdr.markForCheck();
      }
    });
  }

  // ── History ───────────────────────────────────────────────────────────────

  loadHistory(): void {
    this.svc.getAllReturns().subscribe(r => { this.allReturns = r; this.cdr.markForCheck(); });
    this.svc.getAllExchanges().subscribe(e => { this.allExchanges = e; this.cdr.markForCheck(); });
    this.loadMonthlyStats();
  }

  loadMonthlyStats(): void {
    this.svc.getMonthlyStats(this.statsMonth).subscribe({
      next: s => { this.monthStats = s; this.cdr.markForCheck(); },
      error: () => {}
    });
  }
}
