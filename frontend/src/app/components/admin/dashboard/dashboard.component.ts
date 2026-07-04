import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DecimalPipe, SlicePipe } from '@angular/common';
import { ReportService } from '../../../services/report.service';
import { DashboardSummary } from '../../../models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, SlicePipe],
  template: `
    <h1 class="admin-page-title">Dashboard</h1>
    @if (loading) {
      <div class="spinner"></div>
    } @else if (data) {
      <!-- KPI cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">This Month Revenue</div>
          <div class="kpi-value">₹{{ data.currentMonthRevenue | number:'1.0-0' }}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Total Orders</div>
          <div class="kpi-value">{{ data.totalOrders }}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Products Sold</div>
          <div class="kpi-value">{{ data.totalProductsSold }}</div>
        </div>
        <div class="kpi-card kpi-warn">
          <div class="kpi-label">Low Stock Alerts</div>
          <div class="kpi-value">{{ data.lowStockCount }}</div>
        </div>
      </div>

      <!-- Top products + daily sales -->
      <div class="dash-split mt-32">
        <div class="card" style="padding:24px;flex:1;">
          <h2 class="card-h2">Top 5 Products</h2>
          <table>
            <thead><tr><th>Product</th><th>Qty Sold</th><th>Revenue</th></tr></thead>
            <tbody>
              @for (p of data.topProducts; track p.productId) {
                <tr>
                  <td>{{ p.productName }}</td>
                  <td>{{ p.quantitySold }}</td>
                  <td>₹{{ p.revenue | number:'1.0-0' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="card" style="padding:24px;flex:1;">
          <h2 class="card-h2">Category Sales</h2>
          <table>
            <thead><tr><th>Category</th><th>Qty</th><th>Revenue</th></tr></thead>
            <tbody>
              @for (c of data.categorySales; track c.category) {
                <tr>
                  <td>{{ c.category }}</td>
                  <td>{{ c.quantitySold }}</td>
                  <td>₹{{ c.revenue | number:'1.0-0' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Daily sales chart (simple bar) -->
      <div class="card mt-32" style="padding:24px;">
        <h2 class="card-h2">Daily Sales — {{ currentMonth }}</h2>
        <div class="bar-chart">
          @for (d of data.dailySales; track d.date) {
            @if (d.revenue > 0) {
              <div class="bar-wrap">
                <div class="bar-bar" [style.height.px]="barHeight(d.revenue)" title="₹{{ d.revenue }}"></div>
                <div class="bar-label">{{ d.date | slice:8:10 }}</div>
              </div>
            }
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .admin-page-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 24px; color: #111111; }
    .mt-32 { margin-top: 32px; }

    /* KPI cards */
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }
    .kpi-card {
      background: #805500;
      border-radius: 10px;
      padding: 24px;
      box-shadow: 0 4px 16px rgba(128,85,0,.35);
      border: 1px solid #9a6700;
    }
    .kpi-warn { border-left: 4px solid #f39c12; background: #7a4f00; }
    .kpi-label { font-size: .82rem; color: rgba(255,255,255,.75); font-weight: 500; text-transform: uppercase; letter-spacing: .05em; }
    .kpi-value { font-size: 2rem; font-weight: 700; color: #fff; margin-top: 8px; }

    /* Tables */
    .dash-split { display: flex; gap: 24px; flex-wrap: wrap; }
    .card { background: #805500; border-radius: 10px; box-shadow: 0 4px 16px rgba(128,85,0,.3); border: 1px solid #9a6700; }
    .card-h2 { font-size: 1rem; font-weight: 700; margin-bottom: 16px; color: #fff; }
    table { width: 100%; border-collapse: collapse; }
    th { font-size: .78rem; text-transform: uppercase; letter-spacing: .04em; color: rgba(255,255,255,.7); font-weight: 600; border-bottom: 1px solid rgba(255,255,255,.2); padding: 6px 8px; text-align: left; }
    td { padding: 8px; font-size: .9rem; color: #fff; border-bottom: 1px solid rgba(255,255,255,.1); }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(255,255,255,.08); }

    /* Bar chart */
    .bar-chart { display: flex; align-items: flex-end; gap: 6px; height: 160px; overflow-x: auto; padding-bottom: 24px; position: relative; }
    .bar-wrap { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .bar-bar { width: 22px; background: #fff; border-radius: 3px 3px 0 0; min-height: 4px; opacity: .85; }
    .bar-bar:hover { opacity: 1; }
    .bar-label { font-size: .68rem; color: rgba(255,255,255,.7); }
  `]
})
export class DashboardComponent implements OnInit {
  data: DashboardSummary | null = null;
  loading = true;
  currentMonth = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  constructor(private report: ReportService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.report.dashboard().subscribe({
      next: d => { this.data = d; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  barHeight(rev: number): number {
    if (!this.data) return 4;
    const max = Math.max(...this.data.dailySales.map(d => d.revenue), 1);
    return Math.max((rev / max) * 140, 4);
  }
}
