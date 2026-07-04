import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { BillingService } from '../../../services/billing.service';
import { AppSettingsService } from '../../../services/app-settings.service';
import { ToastService } from '../../../services/toast.service';
import { AppSettings, Product, Billing } from '../../../models/models';

interface BillLine {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'app-billing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePipe, DecimalPipe],
  template: `
    <h1 class="admin-page-title">Billing — POS</h1>
    <div class="pos-layout">

      <!-- Left: product search / scan -->
      <div class="pos-left">
        <div class="card" style="padding:20px;">
          <h2 class="section-h2">Add Product</h2>

          <!-- Barcode scanner input (auto-detect on Enter) -->
          <div class="form-group">
            <label class="form-label">🔍 Scan Barcode (or type & Enter)</label>
            <input #barcodeInput [(ngModel)]="barcodeInput_" (keydown.enter)="scanBarcode()"
              class="form-control" placeholder="Scan barcode here..." autocomplete="off" autofocus />
          </div>

          <!-- Manual name search -->
          <div class="form-group">
            <label class="form-label">Search by Name</label>
            <input [(ngModel)]="searchTerm" (ngModelChange)="searchProducts()" class="form-control" placeholder="Product name..." />
          </div>
          @if (searchResults.length > 0) {
            <div class="search-dropdown">
              @for (p of searchResults; track p.id) {
                <div class="search-item" (click)="addProduct(p)">
                  <span>{{ p.name }}</span>
                  <span class="text-muted text-sm">{{ p.category }} | ₹{{ p.finalPrice ?? p.price }}
                    @if ((p.discountAmount || 0) > 0) { <s style="font-size:.75rem">₹{{ p.originalPrice }}</s> }
                  </span>
                </div>
              }
            </div>
          }
        </div>

        <!-- Bill list -->
        <div class="card mt-16" style="padding:20px;">
          <h2 class="section-h2">Current Bill</h2>
          @if (billLines.length === 0) {
            <p class="text-muted text-sm">No items yet. Scan or search above.</p>
          } @else {
            <div class="bill-lines">
              @for (line of billLines; track line.product.id) {
                <div class="bill-row">
                  <div class="bill-name">{{ line.product.name }}</div>
                  <div class="bill-cat text-muted text-sm">{{ line.product.category }}</div>
                  <div class="bill-controls">
                    <button class="qty-btn" (click)="changeQty(line, -1)">−</button>
                    <span class="qty-val">{{ line.quantity }}</span>
                    <button class="qty-btn" (click)="changeQty(line, 1)">+</button>
                  </div>
                  <div class="bill-price">₹{{ ((line.product.finalPrice ?? line.product.price) * line.quantity) | number:'1.0-0' }}</div>
                  <button class="remove-btn" (click)="removeLine(line)">✕</button>
                </div>
              }
            </div>
            <div class="bill-total-row">
              <span>Total</span>
              <span>₹{{ billTotal | number:'1.0-0' }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Right: customer + save -->
      <div class="pos-right">
        <div class="card" style="padding:20px;">
          <h2 class="section-h2">Customer</h2>
          <div class="form-group">
            <label class="form-label">Name</label>
            <input [(ngModel)]="customer.name" class="form-control" placeholder="Optional" />
          </div>
          <div class="form-group">
            <label class="form-label">Phone (for WhatsApp)</label>
            <input [(ngModel)]="customer.phone" class="form-control" placeholder="10-digit" maxlength="10" />
          </div>
          <div class="form-group">
            <label class="form-label">Payment Mode</label>
            <select [(ngModel)]="customer.paymentMode" class="form-control">
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
            </select>
          </div>

          <!-- Bill Discount -->
          <div class="discount-section">
            <label class="form-label">Bill Discount</label>
            <div class="discount-row">
              <select [(ngModel)]="billDiscountType" class="form-control" style="flex:1">
                <option value="NONE">No Discount</option>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed (₹)</option>
              </select>
              @if (billDiscountType !== 'NONE') {
                <input [(ngModel)]="billDiscountValue" type="number" class="form-control" min="0"
                  style="flex:1" [placeholder]="billDiscountType === 'PERCENTAGE' ? '10' : '500'" />
              }
            </div>
            @if (billDiscountType !== 'NONE' && billDiscountAmt > 0) {
              <div class="discount-preview">
                Subtotal: ₹{{ billTotal | number:'1.0-0' }}
                &nbsp;−&nbsp; Discount: ₹{{ billDiscountAmt | number:'1.0-0' }}
              </div>
            }
          </div>

          <!-- GST -->
          @if (gstSettings?.gstEnabled && gstPct > 0) {
            <div class="gst-preview">
              <div class="gst-row-line">
                <span class="gst-lbl">Subtotal (after discount)</span>
                <span>₹{{ billFinalTotal | number:'1.0-0' }}</span>
              </div>
              <div class="gst-row-line">
                <span class="gst-lbl">GST {{ gstPct }}%</span>
                <span class="gst-amt">+ ₹{{ gstAmt | number:'1.0-0' }}</span>
              </div>
            </div>
          }

          <div class="pos-total-display">
            <span>Grand Total{{ gstSettings?.gstEnabled && gstPct > 0 ? ' (incl. GST)' : '' }}</span>
            <span>₹{{ grandTotal | number:'1.0-0' }}</span>
          </div>

          <button class="btn btn-success btn-block mt-16"
            [disabled]="billLines.length === 0 || saving"
            (click)="saveBill()">
            {{ saving ? 'Saving...' : '💾 Save Bill' }}
          </button>
          <button class="btn btn-outline btn-block mt-8"
            [disabled]="!savedBill"
            (click)="printBill()">
            🖨️ Reprint Receipt
          </button>
          @if (savedBill) {
            <button class="btn btn-return btn-block mt-8"
              (click)="goToReturn(savedBill.id)">
              ↩️ Return Product
            </button>
            <button class="btn btn-exchange btn-block mt-8"
              (click)="goToExchange(savedBill.id)">
              🔄 Exchange Product
            </button>
          }
          <button class="btn btn-warning btn-block mt-8" (click)="clearBill()">
            🗑️ Clear Bill
          </button>
        </div>
      </div>
    </div>

    <!-- 58mm Print Receipt (hidden, revealed on print) -->
    @if (savedBill) {
      <div class="print-receipt" id="receipt">
        <div style="text-align:center;font-weight:700;font-size:14px;">Beauty Textile</div>
        <div style="text-align:center;font-size:11px;">8344515186</div>
        <div class="receipt-divider">--------------------------------</div>
        <div>Bill #{{ savedBill.id }}</div>
        <div>Date: {{ savedBill.createdAt | date:'dd/MM/yyyy HH:mm' }}</div>
        @if (savedBill.customerName) { <div>Customer: {{ savedBill.customerName }}</div> }
        @if (savedBill.phone)         { <div>Phone: {{ savedBill.phone }}</div> }
        <div class="receipt-divider">--------------------------------</div>
        @for (item of savedBill.items; track item.productId) {
          <div class="receipt-item">
            <span>{{ item.productName }}</span>
            <span>{{ item.quantity }}×{{ item.price }}=₹{{ (item.price * item.quantity) | number:'1.0-0' }}</span>
          </div>
        }
        <div class="receipt-divider">--------------------------------</div>
        <div class="receipt-total">Subtotal: ₹{{ savedBill.totalAmount | number:'1.0-0' }}</div>
        @if ((savedBill.discountAmount || 0) > 0) {
          <div class="receipt-total" style="color:#c0392b">Discount: -₹{{ savedBill.discountAmount | number:'1.0-0' }}</div>
        }
        @if ((savedBill.gstPercentage || 0) > 0) {
          <div class="receipt-total">GST {{ savedBill.gstPercentage }}%: ₹{{ savedBill.gstAmount | number:'1.0-0' }}</div>
        }
        <div class="receipt-divider">--------------------------------</div>
        <div class="receipt-total">TOTAL: ₹{{ (savedBill.grandTotal || savedBill.finalAmount || savedBill.totalAmount) | number:'1.0-0' }}</div>
        <div style="text-align:center;margin-top:8px;">Thank You! Visit Again</div>
      </div>
    }
  `,
  styles: [`
    .admin-page-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 24px; }
    .pos-layout { display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap; }
    .pos-left { flex: 1; min-width: 320px; }
    .pos-right { width: 280px; flex-shrink: 0; }
    .section-h2 { font-size: 1rem; font-weight: 700; margin-bottom: 16px; }
    .search-dropdown { border: 1px solid #ddd; border-radius: 6px; overflow: hidden; }
    .search-item { padding: 10px 14px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f0f0f0; }
    .search-item:hover { background: #fef9f9; }
    .bill-lines { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
    .bill-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f5f5f5; }
    .bill-name { flex: 1; font-weight: 500; font-size: .9rem; }
    .bill-cat { font-size: .75rem; }
    .bill-controls { display: flex; align-items: center; gap: 6px; }
    .qty-btn { width: 26px; height: 26px; border-radius: 50%; background: #ecf0f1; font-size: .9rem; display: flex; align-items: center; justify-content: center; }
    .qty-val { min-width: 20px; text-align: center; font-weight: 600; font-size: .9rem; }
    .bill-price { font-weight: 700; min-width: 70px; text-align: right; color: #c0392b; }
    .remove-btn { color: #e74c3c; background: none; font-size: .8rem; padding: 2px 4px; }
    .bill-total-row { display: flex; justify-content: space-between; font-weight: 700; font-size: 1rem; border-top: 2px solid #ecf0f1; padding-top: 12px; }
    .pos-total-display { background: #805500; color: #fff; border-radius: 8px; padding: 16px; display: flex; justify-content: space-between; align-items: center; font-weight: 700; font-size: 1.1rem; margin-top: 8px; }
    .discount-section { margin-bottom: 12px; }
    .discount-row { display: flex; gap: 8px; align-items: center; }
    .discount-preview { font-size: .8rem; color: #805500; margin-top: 4px; font-weight: 600; }
    .gst-preview { background: #fff9f0; border: 1px solid #f5e6c8; border-radius: 6px; padding: 10px 12px; margin-bottom: 10px; font-size: .82rem; }
    .gst-row-line { display: flex; justify-content: space-between; padding: 2px 0; }
    .gst-lbl { color: #666; }
    .gst-amt { color: #c0392b; font-weight: 600; }
    .btn-return   { background: #c0392b; color: #fff; }
    .btn-exchange { background: #805500; color: #fff; }
    /* Print receipt — hidden on screen, shown only when printing (global styles.scss handles @media print) */
    .print-receipt { display: none; }
    .receipt-divider { font-family: 'Courier New', monospace; letter-spacing: .05em; }
    .receipt-item { display: flex; justify-content: space-between; font-size: 11px; margin: 2px 0; }
    .receipt-total { font-weight: 700; font-size: 13px; text-align: right; margin-top: 4px; }
    @media (max-width: 700px) { .pos-right { width: 100%; } }
  `]
})
export class BillingComponent implements OnInit, AfterViewInit {
  @ViewChild('barcodeInput') barcodeEl!: ElementRef<HTMLInputElement>;
  billLines: BillLine[] = [];
  barcodeInput_ = '';
  searchTerm = '';
  searchResults: Product[] = [];
  saving = false;
  savedBill: Billing | null = null;
  customer = { name: '', phone: '', paymentMode: 'CASH' };
  billDiscountType = 'NONE';
  billDiscountValue = 0;
  gstSettings: AppSettings | null = null;

  get billTotal(): number {
    return this.billLines.reduce((s, l) => s + (l.product.finalPrice ?? l.product.price) * l.quantity, 0);
  }

  get billDiscountAmt(): number {
    if (this.billDiscountType === 'PERCENTAGE') return +(this.billTotal * this.billDiscountValue / 100).toFixed(2);
    if (this.billDiscountType === 'FIXED') return Math.min(this.billDiscountValue, this.billTotal);
    return 0;
  }

  get billFinalTotal(): number { return this.billTotal - this.billDiscountAmt; }

  get gstPct(): number {
    return this.gstSettings?.gstEnabled ? (this.gstSettings.gstPercentage ?? 0) : 0;
  }

  get gstAmt(): number {
    return +(this.billFinalTotal * this.gstPct / 100).toFixed(2);
  }

  get grandTotal(): number { return this.billFinalTotal + this.gstAmt; }

  constructor(
    private prodSvc: ProductService,
    private billSvc: BillingService,
    private settingsSvc: AppSettingsService,
    private toast: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.settingsSvc.getGstSettings().subscribe({
      next: s => { this.gstSettings = s; this.cdr.markForCheck(); },
      error: () => {}   // GST unavailable — silent, no GST applied
    });
  }

  ngAfterViewInit(): void {
    // Auto-focus barcode input so scanner can work immediately on page load
    setTimeout(() => this.barcodeEl?.nativeElement?.focus(), 100);
  }

  focusBarcode(): void {
    this.barcodeEl?.nativeElement?.focus();
  }

  scanBarcode(): void {
    const code = this.barcodeInput_.trim();
    if (!code) return;
    this.prodSvc.getByBarcode(code).subscribe({
      next: p => { this.addProduct(p); this.barcodeInput_ = ''; this.focusBarcode(); this.cdr.markForCheck(); },
      error: () => { this.toast.error('No product found for barcode: ' + code); this.barcodeInput_ = ''; this.focusBarcode(); this.cdr.markForCheck(); }
    });
  }

  searchProducts(): void {
    if (!this.searchTerm.trim()) { this.searchResults = []; return; }
    this.prodSvc.getAll(undefined, this.searchTerm).subscribe(r => { this.searchResults = r.slice(0, 8); this.cdr.markForCheck(); });
  }

  addProduct(p: Product): void {
    const line = this.billLines.find(l => l.product.id === p.id);
    if (line) {
      line.quantity++;
    } else {
      this.billLines.push({ product: p, quantity: 1 });
    }
    this.searchTerm = '';
    this.searchResults = [];
    this.toast.success(`${p.name} added`);
  }

  changeQty(line: BillLine, delta: number): void {
    const nq = line.quantity + delta;
    if (nq < 1) { this.removeLine(line); return; }
    line.quantity = nq;
  }

  removeLine(line: BillLine): void {
    this.billLines = this.billLines.filter(l => l !== line);
  }

  clearBill(): void {
    this.billLines = [];
    this.savedBill = null;
    this.billDiscountType = 'NONE';
    this.billDiscountValue = 0;
    this.customer = { name: '', phone: '', paymentMode: 'CASH' };
  }

  goToReturn(billId: number): void {
    this.router.navigate(['/admin/returns'], { queryParams: { billId } });
  }

  goToExchange(billId: number): void {
    this.router.navigate(['/admin/returns'], { queryParams: { billId } });
  }

  saveBill(): void {
    if (this.billLines.length === 0) return;
    this.saving = true;
    const req = {
      customerName: this.customer.name,
      phone: this.customer.phone,
      paymentMode: this.customer.paymentMode,
      sendWhatsApp: false,
      discountType: this.billDiscountType,
      discountValue: this.billDiscountType === 'NONE' ? 0 : this.billDiscountValue,
      items: this.billLines.map(l => ({ productId: l.product.id, quantity: l.quantity }))
    };
    this.billSvc.create(req).subscribe({
      next: bill => {
        this.savedBill = bill;
        this.saving = false;
        this.cdr.markForCheck();
        this.toast.success(`Bill #${bill.id} saved to database ✓ Click Print Receipt to print.`);
        this.billLines = [];
      },
      error: err => {
        this.saving = false;
        this.cdr.markForCheck();
        this.toast.error(err.error?.message || 'Failed to save bill');
      }
    });
  }

  printBill(): void {
    window.print();
  }
}
