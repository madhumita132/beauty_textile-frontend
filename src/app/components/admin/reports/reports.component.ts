import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ReportService } from '../../../services/report.service';
import { BillingService } from '../../../services/billing.service';
import { MonthlyReport, ProductSales, CategorySales, Billing } from '../../../models/models';
import { ToastService } from '../../../services/toast.service';

type Tab = 'daily' | 'monthly' | 'product' | 'category';

@Component({
  selector: 'app-reports',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DecimalPipe, DatePipe],
  template: `
    <h1 class="admin-page-title">Sales Reports</h1>

    <!-- Tabs -->
    <div class="tabs">
      <button [class.active]="tab==='daily'"    (click)="tab='daily'">Daily</button>
      <button [class.active]="tab==='monthly'" (click)="tab='monthly'">Monthly</button>
      <button [class.active]="tab==='product'"  (click)="tab='product'">Product-wise</button>
      <button [class.active]="tab==='category'" (click)="tab='category'">Category-wise</button>
    </div>

    <!-- Daily billing details -->
    @if (tab === 'daily') {
      <div class="report-filters">
        <label class="form-label" style="margin:0">Date</label>
        <input [(ngModel)]="dailyDate" type="date" class="form-control" style="width:170px" (keydown.enter)="loadDaily()" />
        <button class="btn btn-primary btn-sm" (click)="loadDaily()">Load</button>
      </div>
      @if (dailyLoading) { <div class="spinner"></div> }
      @else if (dailyBills.length > 0) {
        <div class="kpi-row">
          <div class="kpi-small"><div class="kpi-label">Bills</div><div class="kpi-value">{{ dailyBills.length }}</div></div>
          <div class="kpi-small"><div class="kpi-label">Revenue</div><div class="kpi-value">₹{{ dailyTotalRevenue | number:'1.0-0' }}</div></div>
          <div class="kpi-small"><div class="kpi-label">Items Sold</div><div class="kpi-value">{{ dailyTotalItems }}</div></div>
        </div>
        <div class="card mt-16" style="padding:12px 20px">
          @for (b of dailyBills; track b.id) {
            <div class="daily-bill">
              <div class="daily-bill-head" (click)="toggleBillExpand(b.id)">
                <div>
                  <strong>Bill #{{ b.id }}</strong> - {{ b.customerName || 'Walk-in' }}
                  @if (b.phone) { <span class="text-muted text-sm"> | {{ b.phone }}</span> }
                  @if (b.status !== 'ACTIVE') { <span class="bill-status-badge">{{ b.status }}</span> }
                </div>
                <div class="daily-bill-meta">
                  <span class="text-muted text-sm">{{ b.createdAt | date:'HH:mm' }}</span>
                  <span class="daily-bill-amt">₹{{ (b.grandTotal || b.finalAmount) | number:'1.0-0' }}</span>
                  <span class="expand-caret">{{ expandedBillId === b.id ? '▲' : '▼' }}</span>
                </div>
              </div>
              @if (expandedBillId === b.id) {
                <table class="daily-bill-items">
                  <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
                  <tbody>
                    @for (it of b.items; track it.productId) {
                      <tr><td>{{ it.productName }}</td><td>{{ it.quantity }}</td><td>₹{{ it.price }}</td><td>₹{{ (it.price * it.quantity) | number:'1.0-0' }}</td></tr>
                    }
                  </tbody>
                </table>
                <div class="daily-bill-summary">
                  <span>Subtotal: ₹{{ b.totalAmount | number:'1.0-0' }}</span>
                  @if ((b.discountAmount || 0) > 0) { <span>Discount: -₹{{ b.discountAmount | number:'1.0-0' }}</span> }
                  @if ((b.gstAmount || 0) > 0) { <span>GST: ₹{{ b.gstAmount | number:'1.0-0' }}</span> }
                  <span><strong>Total: ₹{{ (b.grandTotal || b.finalAmount) | number:'1.0-0' }}</strong></span>
                </div>
              }
            </div>
          }
        </div>
      } @else if (dailyAttempted) {
        <p class="text-muted text-sm">No bills found for this date.</p>
      }
    }

    <!-- Monthly -->
    @if (tab === 'monthly') {
      <div class="report-filters">
        <input [(ngModel)]="month" type="month" class="form-control" style="width:180px" />
        <button class="btn btn-primary btn-sm" (click)="loadMonthly()">Load</button>
        @if (monthlyData) {
          <button class="btn btn-outline btn-sm" (click)="exportMonthlyPdf()">Print/PDF</button>
          <button class="btn btn-outline btn-sm" (click)="exportMonthlyXlsx()">CSV</button>
        }
      </div>
      @if (monthlyData) {
        <div class="print-report print-only">
          <div class="print-report-head">
            <div class="print-report-title">Beauty Textile Monthly Report</div>
            <div class="print-report-subtitle">Month: {{ month }}</div>
          </div>
          <div class="print-report-grid">
            <div class="print-report-card">
              <div class="print-report-label">Total Sales</div>
              <div class="print-report-value">₹{{ monthlyData.totalSales | number:'1.0-0' }}</div>
            </div>
            <div class="print-report-card">
              <div class="print-report-label">Orders</div>
              <div class="print-report-value">{{ monthlyData.totalOrders }}</div>
            </div>
            <div class="print-report-card">
              <div class="print-report-label">Products Sold</div>
              <div class="print-report-value">{{ monthlyData.totalProductsSold }}</div>
            </div>
          </div>
          <div class="print-report-section">
            <div class="print-report-heading">Top Products</div>
            @for (p of monthlyData.topProducts; track p.productId) {
              <div class="print-report-row">
                <span>{{ p.productName }}</span>
                <span>{{ p.quantitySold }}</span>
                <span>₹{{ p.revenue | number:'1.0-0' }}</span>
              </div>
            }
          </div>
          <div class="print-report-section">
            <div class="print-report-heading">Slow Products</div>
            @for (p of monthlyData.lowProducts; track p.productId) {
              <div class="print-report-row">
                <span>{{ p.productName }}</span>
                <span>{{ p.quantitySold }}</span>
                <span>₹{{ p.revenue | number:'1.0-0' }}</span>
              </div>
            }
          </div>
        </div>
      }
      @if (loadingReport) { <div class="spinner"></div> }
      @else if (monthlyData) {
        <div class="kpi-row">
          <div class="kpi-small"><div class="kpi-label">Total Sales</div><div class="kpi-value">₹{{ monthlyData.totalSales | number:'1.0-0' }}</div></div>
          <div class="kpi-small"><div class="kpi-label">Orders</div><div class="kpi-value">{{ monthlyData.totalOrders }}</div></div>
          <div class="kpi-small"><div class="kpi-label">Products Sold</div><div class="kpi-value">{{ monthlyData.totalProductsSold }}</div></div>
        </div>
        <div class="report-tables mt-16">
          <div class="card" style="padding:20px;flex:1">
            <h3 class="card-h3">Top Products</h3>
            <table>
              <thead><tr><th>Product</th><th>Qty</th><th>Revenue</th></tr></thead>
              <tbody>
                @for (p of monthlyData.topProducts; track p.productId) {
                  <tr><td>{{ p.productName }}</td><td>{{ p.quantitySold }}</td><td>₹{{ p.revenue | number:'1.0-0' }}</td></tr>
                }
              </tbody>
            </table>
          </div>
          <div class="card" style="padding:20px;flex:1">
            <h3 class="card-h3">Slow Products</h3>
            <table>
              <thead><tr><th>Product</th><th>Qty</th><th>Revenue</th></tr></thead>
              <tbody>
                @for (p of monthlyData.lowProducts; track p.productId) {
                  <tr><td>{{ p.productName }}</td><td>{{ p.quantitySold }}</td><td>₹{{ p.revenue | number:'1.0-0' }}</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    }

    <!-- Product-wise -->
    @if (tab === 'product') {
      <div class="report-filters">
        <label class="form-label" style="margin:0">From</label>
        <input [(ngModel)]="fromDate" type="date" class="form-control" style="width:160px" />
        <label class="form-label" style="margin:0">To</label>
        <input [(ngModel)]="toDate" type="date" class="form-control" style="width:160px" />
        <button class="btn btn-primary btn-sm" (click)="loadProductWise()">Load</button>
        @if (productData.length > 0) {
          <button class="btn btn-outline btn-sm" (click)="exportProductXlsx()">CSV</button>
        }
      </div>
      @if (loadingReport) { <div class="spinner"></div> }
      @else if (productData.length > 0) {
        <div class="table-wrap card mt-16">
          <table>
            <thead><tr><th>#</th><th>Product</th><th>Qty Sold</th><th>Revenue</th></tr></thead>
            <tbody>
              @for (p of productData; track p.productId; let i = $index) {
                <tr><td>{{ i + 1 }}</td><td>{{ p.productName }}</td><td>{{ p.quantitySold }}</td><td>₹{{ p.revenue | number:'1.0-0' }}</td></tr>
              }
            </tbody>
          </table>
        </div>
      }
    }

    <!-- Category-wise -->
    @if (tab === 'category') {
      <div class="report-filters">
        <label class="form-label" style="margin:0">From</label>
        <input [(ngModel)]="fromDate" type="date" class="form-control" style="width:160px" />
        <label class="form-label" style="margin:0">To</label>
        <input [(ngModel)]="toDate" type="date" class="form-control" style="width:160px" />
        <button class="btn btn-primary btn-sm" (click)="loadCategoryWise()">Load</button>
        @if (categoryData.length > 0) {
          <button class="btn btn-outline btn-sm" (click)="exportCategoryXlsx()">CSV</button>
        }
      </div>
      @if (loadingReport) { <div class="spinner"></div> }
      @else if (categoryData.length > 0) {
        <div class="table-wrap card mt-16">
          <table>
            <thead><tr><th>Category</th><th>Qty Sold</th><th>Revenue</th></tr></thead>
            <tbody>
              @for (c of categoryData; track c.category) {
                <tr><td>{{ c.category }}</td><td>{{ c.quantitySold }}</td><td>₹{{ c.revenue | number:'1.0-0' }}</td></tr>
              }
            </tbody>
          </table>
        </div>
        <!-- Simple pie-style bar -->
        <div class="card mt-16" style="padding:20px">
          <h3 class="card-h3">Revenue by Category</h3>
          <div class="cat-bars">
            @for (c of categoryData; track c.category) {
              <div class="cat-bar-row">
                <div class="cat-bar-label">{{ c.category }}</div>
                <div class="cat-bar-track">
                  <div class="cat-bar-fill" [style.width.%]="catPercent(c.revenue)"></div>
                </div>
                <div class="cat-bar-val">₹{{ c.revenue | number:'1.0-0' }}</div>
              </div>
            }
          </div>
        </div>
      }
    }
  `,
  styles: [`
    .admin-page-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 24px; }
    .tabs { display: flex; gap: 8px; margin-bottom: 24px; }
    .tabs button { padding: 8px 20px; border-radius: 6px; background: #ecf0f1; color: #2c3e50; font-weight: 500; font-size: .9rem; }
    .tabs button.active { background: #c0392b; color: #fff; }
    .report-filters { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
    .kpi-row { display: flex; gap: 16px; flex-wrap: wrap; }
    .kpi-small { background: #fff; border-radius: 10px; padding: 16px 20px; flex: 1; min-width: 140px; box-shadow: 0 2px 8px rgba(0,0,0,.07); }
    .kpi-label { font-size: .78rem; color: #7f8c8d; font-weight: 500; text-transform: uppercase; }
    .kpi-value { font-size: 1.6rem; font-weight: 700; margin-top: 4px; }
    .report-tables { display: flex; gap: 16px; flex-wrap: wrap; }
    .card-h3 { font-size: .95rem; font-weight: 700; margin-bottom: 12px; }
    .cat-bars { display: flex; flex-direction: column; gap: 10px; }
    .cat-bar-row { display: flex; align-items: center; gap: 12px; }
    .cat-bar-label { width: 80px; font-size: .85rem; font-weight: 500; }
    .cat-bar-track { flex: 1; background: #ecf0f1; border-radius: 20px; height: 16px; overflow: hidden; }
    .cat-bar-fill { height: 100%; background: #c0392b; border-radius: 20px; transition: width .5s; }
    .cat-bar-val { min-width: 80px; text-align: right; font-size: .85rem; font-weight: 600; }
    .print-only { display: none; }
    .print-report { padding: 20px; background: #fff; color: #000; }
    .print-report-head { margin-bottom: 12px; }
    .print-report-title { font-size: 18px; font-weight: 700; }
    .print-report-subtitle { font-size: 12px; margin-top: 4px; }
    .print-report-grid { display: flex; gap: 10px; margin-bottom: 14px; }
    .print-report-card { border: 1px solid #ddd; border-radius: 8px; padding: 10px 12px; flex: 1; }
    .print-report-label { font-size: 10px; text-transform: uppercase; color: #666; }
    .print-report-value { font-size: 18px; font-weight: 700; margin-top: 4px; }
    .print-report-section { margin-top: 12px; }
    .print-report-heading { font-size: 13px; font-weight: 700; margin-bottom: 6px; }
    .print-report-row { display: flex; justify-content: space-between; gap: 8px; font-size: 11px; padding: 4px 0; border-bottom: 1px solid #eee; }
    .daily-bill { border-bottom: 1px solid #f0f0f0; padding: 10px 0; }
    .daily-bill:last-child { border-bottom: none; }
    .daily-bill-head { display: flex; justify-content: space-between; align-items: center; cursor: pointer; gap: 10px; flex-wrap: wrap; }
    .daily-bill-meta { display: flex; align-items: center; gap: 10px; }
    .daily-bill-amt { font-weight: 700; color: #c0392b; }
    .expand-caret { color: #7f8c8d; font-size: .75rem; }
    .daily-bill-items { width: 100%; margin-top: 8px; font-size: .85rem; }
    .daily-bill-summary { display: flex; gap: 16px; flex-wrap: wrap; font-size: .82rem; margin-top: 6px; color: #555; }
    .bill-status-badge { background: #e74c3c; color: #fff; font-size: .65rem; font-weight: 600; padding: 1px 6px; border-radius: 8px; margin-left: 6px; }
  `]
})
export class ReportsComponent implements OnInit {
  tab: Tab = 'daily';
  month = new Date().toISOString().slice(0, 7);
  fromDate = new Date().toISOString().slice(0, 8) + '01';
  toDate = new Date().toISOString().slice(0, 10);
  loadingReport = false;
  monthlyData: MonthlyReport | null = null;
  productData: ProductSales[] = [];
  categoryData: CategorySales[] = [];

  dailyDate = new Date().toISOString().slice(0, 10);
  dailyBills: Billing[] = [];
  dailyLoading = false;
  dailyAttempted = false;
  expandedBillId: number | null = null;

  constructor(
    private reportSvc: ReportService,
    private billingSvc: BillingService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.loadDaily(); }

  loadDaily(): void {
    this.dailyLoading = true;
    this.dailyAttempted = false;
    this.expandedBillId = null;
    this.billingSvc.search({ date: this.dailyDate }).subscribe({
      next: bills => {
        this.dailyBills = bills;
        this.dailyLoading = false;
        this.dailyAttempted = true;
        this.cdr.markForCheck();
      },
      error: () => {
        this.dailyLoading = false;
        this.dailyAttempted = true;
        this.toast.error('Failed to load daily billing details');
        this.cdr.markForCheck();
      }
    });
  }

  toggleBillExpand(id: number): void {
    this.expandedBillId = this.expandedBillId === id ? null : id;
  }

  get dailyTotalRevenue(): number {
    return this.dailyBills.reduce((s, b) => s + (b.grandTotal || b.finalAmount || b.totalAmount || 0), 0);
  }

  get dailyTotalItems(): number {
    return this.dailyBills.reduce((s, b) => s + (b.items || []).reduce((si, it) => si + it.quantity, 0), 0);
  }

  loadMonthly(): void {
    this.loadingReport = true;
    this.reportSvc.monthly(this.month).subscribe({
      next: d => { this.monthlyData = d; this.loadingReport = false; this.cdr.markForCheck(); },
      error: () => { this.loadingReport = false; this.toast.error('Failed to load report'); this.cdr.markForCheck(); }
    });
  }

  loadProductWise(): void {
    this.loadingReport = true;
    this.reportSvc.productWise(this.fromDate, this.toDate).subscribe({
      next: d => { this.productData = d; this.loadingReport = false; this.cdr.markForCheck(); },
      error: () => { this.loadingReport = false; this.toast.error('Failed to load report'); this.cdr.markForCheck(); }
    });
  }

  loadCategoryWise(): void {
    this.loadingReport = true;
    this.reportSvc.categoryWise(this.fromDate, this.toDate).subscribe({
      next: d => { this.categoryData = d; this.loadingReport = false; this.cdr.markForCheck(); },
      error: () => { this.loadingReport = false; this.toast.error('Failed to load report'); this.cdr.markForCheck(); }
    });
  }

  catPercent(rev: number): number {
    const max = Math.max(...this.categoryData.map(c => c.revenue), 1);
    return (rev / max) * 100;
  }

  // --- Export helpers (no external libs — browser-native) ---

  exportMonthlyPdf(): void {
    this.cdr.markForCheck();
    requestAnimationFrame(() => {
      setTimeout(() => globalThis.print(), 150);
    });
  }

  exportMonthlyXlsx(): void {
    this.csvDownload(
      this.monthlyData!.topProducts.map(p => ({ Product: p.productName, 'Qty Sold': p.quantitySold, Revenue: p.revenue })),
      `monthly-${this.month}`
    );
  }

  exportProductXlsx(): void {
    this.csvDownload(
      this.productData.map(p => ({ Product: p.productName, 'Qty Sold': p.quantitySold, Revenue: p.revenue })),
      `product-wise`
    );
  }

  exportCategoryXlsx(): void {
    this.csvDownload(
      this.categoryData.map(c => ({ Category: c.category, 'Qty Sold': c.quantitySold, Revenue: c.revenue })),
      `category-wise`
    );
  }

  private csvDownload(rows: Record<string, unknown>[], filename: string): void {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const lines = [
      headers.join(','),
      ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
