import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InventoryService } from '../../../services/inventory.service';
import { ToastService } from '../../../services/toast.service';
import {
  ImportResult, InventoryProductRequest, InventorySummary,
  PagedResponse, Product, StockAdjustment, StockAdjustRequest
} from '../../../models/models';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';

type Tab = 'dashboard' | 'products' | 'lowstock' | 'adjust' | 'audit' | 'import' | 'barcodes';

@Component({
  selector: 'app-inventory',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, DatePipe, DecimalPipe, RouterModule,
    MatIconModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDividerModule,
    MatTooltipModule, MatProgressBarModule, MatCheckboxModule
  ],
  template: `
    <h1 class="page-title">Inventory Management</h1>

    <!-- Tab navigation -->
    <div class="tabs">
      @for (t of tabDefs; track t.id) {
        <button [class.active]="tab===t.id" (click)="tab=t.id; onTabChange()">
          <mat-icon>{{ t.icon }}</mat-icon> {{ t.label }}
        </button>
      }
    </div>

    <!-- ═══════════════════════ DASHBOARD ═══════════════════════ -->
    @if (tab === 'dashboard') {
      <div class="section-card">
        <h2>Inventory Overview</h2>
        @if (summary) {
          <div class="kpi-row">
            <div class="kpi-box">
              <div class="kpi-val">{{ summary.totalActiveProducts | number }}</div>
              <div class="kpi-lbl">Active Products</div>
            </div>
            <div class="kpi-box warn">
              <div class="kpi-val">{{ summary.lowStockCount | number }}</div>
              <div class="kpi-lbl">Low Stock</div>
            </div>
            <div class="kpi-box danger">
              <div class="kpi-val">{{ summary.outOfStockCount | number }}</div>
              <div class="kpi-lbl">Out of Stock</div>
            </div>
            <div class="kpi-box green">
              <div class="kpi-val">₹{{ summary.totalInventoryValue | number:'1.0-0' }}</div>
              <div class="kpi-lbl">Inventory Value (Sale)</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-val">{{ summary.categoryCount }}</div>
              <div class="kpi-lbl">Categories</div>
            </div>
          </div>

          <mat-divider style="margin:20px 0"></mat-divider>
          <h3 class="sub-title">Categories</h3>
          <div class="cat-chips">
            @for (c of summary.categories; track c) {
              <span class="cat-chip" (click)="filterByCategory(c)">{{ c }}</span>
            }
          </div>
        } @else {
          <p class="hint-text">Loading summary...</p>
        }

        <mat-divider style="margin:20px 0"></mat-divider>
        <h3 class="sub-title">Quick Actions</h3>
        <div class="quick-actions">
          <button mat-raised-button class="btn-brown" (click)="tab='import'">
            <mat-icon>upload_file</mat-icon> Bulk Import Excel
          </button>
          <button mat-raised-button class="btn-brown" (click)="generateMissingBarcodes()">
            <mat-icon>qr_code</mat-icon> Generate Missing Barcodes
          </button>
          <a [href]="inventorySvc.getImportTemplateUrl()" class="btn mat-raised-button btn-outline">
            <mat-icon>download</mat-icon> Download Import Template
          </a>
          <a [href]="inventorySvc.exportBarcodesExcelUrl()" class="btn mat-raised-button btn-outline">
            <mat-icon>print</mat-icon> Export All Barcodes Excel
          </a>
        </div>
      </div>
    }

    <!-- ═══════════════════════ PRODUCT LIST ═══════════════════════ -->
    @if (tab === 'products' || tab === 'lowstock') {
      <div class="section-card">
        <div class="section-header">
          <h2>{{ tab === 'lowstock' ? 'Low Stock / Out of Stock' : 'All Products' }}</h2>
          <div class="header-actions">
            @if (selectedIds.size > 0) {
              <span class="selection-count">{{ selectedIds.size }} selected</span>
              <mat-form-field appearance="outline" style="width:160px">
                <mat-label>Bulk Status</mat-label>
                <mat-select [(ngModel)]="bulkStatus">
                  <mat-option value="ACTIVE">Active</mat-option>
                  <mat-option value="INACTIVE">Inactive</mat-option>
                  <mat-option value="DISCONTINUED">Discontinued</mat-option>
                </mat-select>
              </mat-form-field>
              <button mat-raised-button class="btn-brown" (click)="applyBulkStatus()">Apply</button>
              <button mat-icon-button (click)="exportSelectedBarcodes()" matTooltip="Export barcodes for selection">
                <mat-icon>print</mat-icon>
              </button>
            }
            <button mat-raised-button class="btn-brown" (click)="openAddProduct()">
              <mat-icon>add</mat-icon> Add Product
            </button>
          </div>
        </div>

        <!-- Search + filter bar -->
        <div class="filter-bar">
          <div class="search-wrap">
            <mat-icon class="search-icon">search</mat-icon>
            <input class="search-input" [(ngModel)]="searchQ" (input)="onSearch()"
              placeholder="Search name, barcode, SKU, category..." />
          </div>
          <mat-form-field appearance="outline" style="width:160px">
            <mat-label>Category</mat-label>
            <mat-select [(ngModel)]="filterCategory" (ngModelChange)="loadPage(0)">
              <mat-option value="">All</mat-option>
              @for (c of (summary?.categories || []); track c) {
                <mat-option [value]="c">{{ c }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" style="width:130px">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="filterStatus" (ngModelChange)="loadPage(0)">
              <mat-option value="">All</mat-option>
              <mat-option value="ACTIVE">Active</mat-option>
              <mat-option value="INACTIVE">Inactive</mat-option>
              <mat-option value="DISCONTINUED">Discontinued</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" style="width:130px">
            <mat-label>Per page</mat-label>
            <mat-select [(ngModel)]="pageSize" (ngModelChange)="loadPage(0)">
              <mat-option [value]="25">25</mat-option>
              <mat-option [value]="50">50</mat-option>
              <mat-option [value]="100">100</mat-option>
              <mat-option [value]="200">200</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Product table -->
        <div class="table-wrap">
          <table class="inv-table">
            <thead>
              <tr>
                <th style="width:36px">
                  <mat-checkbox [checked]="allSelected" (change)="toggleSelectAll($event.checked)"></mat-checkbox>
                </th>
                <th (click)="sortBy('barcode')" class="sortable">Barcode <mat-icon class="sort-icon">{{ sortCol==='barcode' ? (sortDir==='asc'?'arrow_upward':'arrow_downward') : 'unfold_more' }}</mat-icon></th>
                <th>SKU</th>
                <th (click)="sortBy('name')" class="sortable">Name <mat-icon class="sort-icon">{{ sortCol==='name' ? (sortDir==='asc'?'arrow_upward':'arrow_downward') : 'unfold_more' }}</mat-icon></th>
                <th (click)="sortBy('category')" class="sortable">Category <mat-icon class="sort-icon">{{ sortCol==='category' ? (sortDir==='asc'?'arrow_upward':'arrow_downward') : 'unfold_more' }}</mat-icon></th>
                <th class="num-col">Price</th>
                <th class="num-col">Cost</th>
                <th class="num-col" (click)="sortBy('stock')" class="sortable num-col">Stock <mat-icon class="sort-icon">{{ sortCol==='stock' ? (sortDir==='asc'?'arrow_upward':'arrow_downward') : 'unfold_more' }}</mat-icon></th>
                <th>Supplier</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (loading) {
                <tr><td colspan="11" class="loading-cell">
                  <mat-progress-bar mode="indeterminate"></mat-progress-bar>
                </td></tr>
              }
              @for (p of pagedResult?.content || []; track p.id) {
                <tr [class.row-selected]="selectedIds.has(p.id)"
                    [class.row-lowstock]="p.stock <= (p.reorderLevel||5) && p.stock > 0"
                    [class.row-outstock]="p.stock === 0">
                  <td><mat-checkbox [checked]="selectedIds.has(p.id)"
                    (change)="toggleSelect(p.id, $event.checked)"></mat-checkbox></td>
                  <td class="mono">{{ p.barcode }}</td>
                  <td class="mono">{{ p.sku || '—' }}</td>
                  <td class="bold">{{ p.name }}</td>
                  <td><span class="cat-badge">{{ p.category }}</span></td>
                  <td class="num-col">₹{{ p.price | number:'1.0-0' }}</td>
                  <td class="num-col text-muted">{{ p.costPrice ? ('₹' + (p.costPrice | number:'1.0-0')) : '—' }}</td>
                  <td class="num-col">
                    <span [class.stock-low]="p.stock <= (p.reorderLevel||5) && p.stock > 0"
                          [class.stock-out]="p.stock === 0">{{ p.stock }}</span>
                  </td>
                  <td class="text-muted text-sm">{{ p.supplier || '—' }}</td>
                  <td><span class="status-badge status-{{ (p.status||'ACTIVE').toLowerCase() }}">
                    {{ p.status || 'ACTIVE' }}</span>
                  </td>
                  <td class="action-cell">
                    <button mat-icon-button (click)="openEdit(p)" matTooltip="Edit">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button (click)="openAdjust(p)" matTooltip="Adjust stock">
                      <mat-icon>tune</mat-icon>
                    </button>
                    <button mat-icon-button (click)="openHistory(p)" matTooltip="Stock history">
                      <mat-icon>history</mat-icon>
                    </button>
                    <button mat-icon-button (click)="printBarcode(p)" matTooltip="Print barcode">
                      <mat-icon>qr_code</mat-icon>
                    </button>
                  </td>
                </tr>
              }
              @if (!loading && (pagedResult?.content?.length || 0) === 0) {
                <tr><td colspan="11" class="empty-cell">No products found</td></tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (pagedResult && pagedResult.totalPages > 1) {
          <div class="pagination">
            <button mat-icon-button [disabled]="currentPage === 0" (click)="loadPage(0)">
              <mat-icon>first_page</mat-icon>
            </button>
            <button mat-icon-button [disabled]="currentPage === 0" (click)="loadPage(currentPage - 1)">
              <mat-icon>chevron_left</mat-icon>
            </button>
            <span class="page-info">
              Page {{ currentPage + 1 }} of {{ pagedResult.totalPages }}
              &nbsp;({{ pagedResult.totalElements | number }} products)
            </span>
            <button mat-icon-button [disabled]="pagedResult.last" (click)="loadPage(currentPage + 1)">
              <mat-icon>chevron_right</mat-icon>
            </button>
            <button mat-icon-button [disabled]="pagedResult.last" (click)="loadPage(pagedResult.totalPages - 1)">
              <mat-icon>last_page</mat-icon>
            </button>
          </div>
        }
      </div>

      <!-- Inline product edit / add form -->
      @if (editingProduct !== null) {
        <div class="section-card" style="margin-top:20px">
          <h2>{{ editForm.id ? 'Edit Product' : 'Add Product' }}</h2>
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Name *</mat-label>
              <input matInput [(ngModel)]="editForm.name" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Category *</mat-label>
              <input matInput [(ngModel)]="editForm.category" list="catlist" />
              <datalist id="catlist">
                @for (c of summary?.categories || []; track c) { <option [value]="c"></option> }
              </datalist>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Sale Price *</mat-label>
              <input matInput type="number" [(ngModel)]="editForm.price" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Cost Price</mat-label>
              <input matInput type="number" [(ngModel)]="editForm.costPrice" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Stock</mat-label>
              <input matInput type="number" [(ngModel)]="editForm.stock" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Reorder Level</mat-label>
              <input matInput type="number" [(ngModel)]="editForm.reorderLevel" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Barcode (blank = auto)</mat-label>
              <input matInput [(ngModel)]="editForm.barcode" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>SKU (blank = auto)</mat-label>
              <input matInput [(ngModel)]="editForm.sku" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Supplier</mat-label>
              <input matInput [(ngModel)]="editForm.supplier" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select [(ngModel)]="editForm.status">
                <mat-option value="ACTIVE">Active</mat-option>
                <mat-option value="INACTIVE">Inactive</mat-option>
                <mat-option value="DISCONTINUED">Discontinued</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" style="grid-column:span 2">
              <mat-label>Description</mat-label>
              <textarea matInput [(ngModel)]="editForm.description" rows="2"></textarea>
            </mat-form-field>
          </div>
          <div class="form-actions">
            <button mat-raised-button class="btn-brown" [disabled]="formSaving" (click)="saveProduct()">
              {{ formSaving ? 'Saving...' : (editForm.id ? 'Update Product' : 'Create Product') }}
            </button>
            <button mat-stroked-button (click)="editingProduct = null">Cancel</button>
          </div>
        </div>
      }

      <!-- Stock history panel -->
      @if (historyProduct) {
        <div class="section-card" style="margin-top:20px">
          <div class="section-header">
            <h2>Stock History — {{ historyProduct.name }}</h2>
            <button mat-icon-button (click)="historyProduct=null"><mat-icon>close</mat-icon></button>
          </div>
          <div class="table-wrap">
            <table class="inv-table">
              <thead>
                <tr>
                  <th>Date</th><th>Reason</th><th>Change</th><th>Before</th>
                  <th>After</th><th>Note</th><th>By</th>
                </tr>
              </thead>
              <tbody>
                @for (a of stockHistory; track a.id) {
                  <tr>
                    <td>{{ a.adjustedAt | date:'dd/MM/yy HH:mm' }}</td>
                    <td><span class="reason-badge reason-{{ a.reason.toLowerCase() }}">{{ a.reason }}</span></td>
                    <td [class.delta-pos]="a.quantityDelta > 0" [class.delta-neg]="a.quantityDelta < 0">
                      {{ a.quantityDelta > 0 ? '+' : '' }}{{ a.quantityDelta }}
                    </td>
                    <td>{{ a.stockBefore }}</td>
                    <td class="bold">{{ a.stockAfter }}</td>
                    <td class="text-sm text-muted">{{ a.note || '—' }}</td>
                    <td class="text-sm text-muted">{{ a.adjustedBy || '—' }}</td>
                  </tr>
                }
                @if (stockHistory.length === 0) {
                  <tr><td colspan="7" class="empty-cell">No history</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Barcode print panel -->
      @if (barcodeProduct) {
        <div class="section-card barcode-panel" style="margin-top:20px">
          <div class="section-header">
            <h2>Barcode — {{ barcodeProduct.name }}</h2>
            <button mat-icon-button (click)="barcodeProduct=null"><mat-icon>close</mat-icon></button>
          </div>
          <div class="barcode-display" id="barcode-print-area">
            <div style="text-align:center;font-weight:700;font-size:13px">{{ barcodeProduct.name }}</div>
            <div style="text-align:center;font-size:11px;color:#666">{{ barcodeProduct.category }}</div>
            <img [src]="inventorySvc.getBarcodeImageUrl(barcodeProduct.barcode, 350, 80)"
                 [alt]="barcodeProduct.barcode" style="display:block;margin:8px auto" />
            <div style="text-align:center;font-family:monospace;font-size:12px">{{ barcodeProduct.barcode }}</div>
            @if (barcodeProduct.sku) {
              <div style="text-align:center;font-size:11px;color:#888">SKU: {{ barcodeProduct.sku }}</div>
            }
            <div style="text-align:center;font-weight:700;font-size:14px;margin-top:4px">₹{{ barcodeProduct.price }}</div>
          </div>
          <div class="form-actions">
            <button mat-raised-button class="btn-brown" onclick="window.print()">
              <mat-icon>print</mat-icon> Print Label
            </button>
          </div>
        </div>
      }
    }

    <!-- ═══════════════════════ STOCK ADJUST ═══════════════════════ -->
    @if (tab === 'adjust') {
      <div class="section-card">
        <h2>Stock Adjustment</h2>
        <p class="hint-text">Manually adjust stock levels. All changes are recorded in the audit trail.</p>

        <div class="form-grid adj-grid">
          <mat-form-field appearance="outline" style="grid-column:span 2">
            <mat-label>Search Product</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [(ngModel)]="adjSearch" (input)="searchForAdj()" placeholder="Name, barcode, SKU" />
          </mat-form-field>

          @if (adjResults.length > 0 && !adjProduct) {
            <div class="adj-results" style="grid-column:span 2">
              @for (p of adjResults; track p.id) {
                <div class="adj-result-row" (click)="selectAdjProduct(p)">
                  <span class="bold">{{ p.name }}</span>
                  <span class="cat-badge">{{ p.category }}</span>
                  <span class="mono">{{ p.barcode }}</span>
                  <span class="bold">Stock: {{ p.stock }}</span>
                </div>
              }
            </div>
          }

          @if (adjProduct) {
            <div class="adj-selected" style="grid-column:span 2">
              <mat-icon>checkroom</mat-icon>
              <div>
                <div class="bold">{{ adjProduct.name }}</div>
                <div class="text-muted text-sm">{{ adjProduct.category }} · {{ adjProduct.barcode }}
                  · Current stock: <strong>{{ adjProduct.stock }}</strong>
                </div>
              </div>
              <button mat-icon-button (click)="adjProduct=null;adjSearch='';adjResults=[]">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <mat-form-field appearance="outline">
              <mat-label>Quantity Delta (+/-)</mat-label>
              <input matInput type="number" [(ngModel)]="adjDelta"
                [placeholder]="'+10 to add, -5 to remove'" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Reason</mat-label>
              <mat-select [(ngModel)]="adjReason">
                <mat-option value="PURCHASE">Purchase / Restock</mat-option>
                <mat-option value="MANUAL_ADD">Manual Add</mat-option>
                <mat-option value="MANUAL_REMOVE">Manual Remove</mat-option>
                <mat-option value="AUDIT_CORRECTION">Audit Correction</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" style="grid-column:span 2">
              <mat-label>Note (optional)</mat-label>
              <input matInput [(ngModel)]="adjNote" placeholder="e.g. Supplier delivery 30 units" />
            </mat-form-field>

            @if (adjDelta !== null) {
              <div class="adj-preview" style="grid-column:span 2"
                [class.preview-pos]="adjDelta > 0" [class.preview-neg]="adjDelta < 0">
                <mat-icon>{{ adjDelta >= 0 ? 'add_circle' : 'remove_circle' }}</mat-icon>
                New stock will be: <strong>{{ (adjProduct.stock + adjDelta) }}</strong>
                ({{ adjDelta > 0 ? '+' : '' }}{{ adjDelta }})
              </div>
            }

            <div style="grid-column:span 2">
              <button mat-raised-button class="btn-brown btn-lg" [disabled]="adjSaving || adjDelta === 0"
                (click)="submitAdjustment()">
                {{ adjSaving ? 'Saving...' : '✅ Apply Adjustment' }}
              </button>
            </div>
          }
        </div>
      </div>
    }

    <!-- ═══════════════════════ AUDIT TRAIL ═══════════════════════ -->
    @if (tab === 'audit') {
      <div class="section-card">
        <h2>Stock Audit Trail</h2>
        <div class="filter-bar">
          <mat-form-field appearance="outline">
            <mat-label>From</mat-label>
            <input matInput type="date" [(ngModel)]="auditFrom" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>To</mat-label>
            <input matInput type="date" [(ngModel)]="auditTo" />
          </mat-form-field>
          <button mat-raised-button class="btn-brown" (click)="loadAudit()">Load</button>
        </div>
        <div class="table-wrap">
          <table class="inv-table">
            <thead>
              <tr>
                <th>Date</th><th>Product</th><th>Barcode</th>
                <th>Reason</th><th>Change</th><th>Before</th><th>After</th>
                <th>Note</th><th>By</th>
              </tr>
            </thead>
            <tbody>
              @for (a of auditRows; track a.id) {
                <tr>
                  <td>{{ a.adjustedAt | date:'dd/MM/yy HH:mm' }}</td>
                  <td class="bold">{{ a.productName }}</td>
                  <td class="mono">{{ a.productBarcode }}</td>
                  <td><span class="reason-badge reason-{{ a.reason.toLowerCase() }}">{{ a.reason }}</span></td>
                  <td [class.delta-pos]="a.quantityDelta > 0" [class.delta-neg]="a.quantityDelta < 0">
                    {{ a.quantityDelta > 0 ? '+' : '' }}{{ a.quantityDelta }}
                  </td>
                  <td>{{ a.stockBefore }}</td>
                  <td class="bold">{{ a.stockAfter }}</td>
                  <td class="text-sm text-muted">{{ a.note || '—' }}</td>
                  <td class="text-sm text-muted">{{ a.adjustedBy || '—' }}</td>
                </tr>
              }
              @if (auditRows.length === 0) {
                <tr><td colspan="9" class="empty-cell">Select a date range and click Load</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <!-- ═══════════════════════ BULK IMPORT ═══════════════════════ -->
    @if (tab === 'import') {
      <div class="section-card">
        <h2>Bulk Product Import (Excel)</h2>

        <div class="import-steps">
          <div class="step">
            <div class="step-num">1</div>
            <div class="step-body">
              <div class="step-title">Download Template</div>
              <div class="step-desc">Get the Excel template with all required columns.</div>
              <a [href]="inventorySvc.getImportTemplateUrl()" mat-raised-button class="btn-brown">
                <mat-icon>download</mat-icon> Download Template
              </a>
            </div>
          </div>
          <div class="step">
            <div class="step-num">2</div>
            <div class="step-body">
              <div class="step-title">Fill in Products</div>
              <div class="step-desc">Fill the Excel with your products. Leave barcode/SKU blank to auto-generate.</div>
            </div>
          </div>
          <div class="step">
            <div class="step-num">3</div>
            <div class="step-body">
              <div class="step-title">Upload File</div>
              <div class="step-desc">Upload the filled Excel. New rows are created; existing barcodes/SKUs are updated.</div>
              <div class="file-drop" (click)="fileInput.click()" (dragover)="$event.preventDefault()"
                   (drop)="onFileDrop($event)">
                @if (importFile) {
                  <mat-icon style="color:#805500">insert_drive_file</mat-icon>
                  <span>{{ importFile.name }}</span>
                  <span class="text-muted text-sm">({{ (importFile.size / 1024) | number:'1.0-0' }} KB)</span>
                } @else {
                  <mat-icon style="color:#8a7560">upload_file</mat-icon>
                  <span class="hint-text">Click or drag & drop your Excel file here</span>
                }
              </div>
              <input #fileInput type="file" accept=".xlsx,.xls" style="display:none"
                (change)="onFileSelect($event)" />

              @if (importFile) {
                <button mat-raised-button class="btn-brown btn-lg mt-16"
                  [disabled]="importSaving" (click)="uploadImport()">
                  {{ importSaving ? 'Importing...' : '⬆️ Start Import' }}
                </button>
              }
            </div>
          </div>
        </div>

        @if (importResult) {
          <div class="import-result" [class.has-errors]="importResult.errorCount > 0">
            <div class="result-row">
              <span class="result-icon green">✅</span>
              <span><strong>{{ importResult.created }}</strong> products created</span>
            </div>
            <div class="result-row">
              <span class="result-icon green">🔄</span>
              <span><strong>{{ importResult.updated }}</strong> products updated</span>
            </div>
            @if (importResult.errorCount > 0) {
              <div class="result-row danger">
                <span class="result-icon">⚠️</span>
                <span><strong>{{ importResult.errorCount }}</strong> errors:</span>
              </div>
              @for (e of importResult.errors; track e) {
                <div class="error-row">{{ e }}</div>
              }
            }
          </div>
        }
      </div>
    }

    <!-- ═══════════════════════ BARCODE PRINTING ═══════════════════════ -->
    @if (tab === 'barcodes') {
      <div class="section-card">
        <h2>Bulk Barcode Printing</h2>
        <p class="hint-text">Export barcode data to Excel for label printing, or view individual product labels below.</p>

        <div class="barcode-actions">
          <a [href]="inventorySvc.exportBarcodesExcelUrl()" mat-raised-button class="btn-brown">
            <mat-icon>table_chart</mat-icon> Export All Barcodes (Excel)
          </a>
          <button mat-raised-button class="btn-brown" (click)="generateMissingBarcodes()">
            <mat-icon>qr_code</mat-icon> Generate Missing Barcodes
          </button>
        </div>

        <mat-divider style="margin:20px 0"></mat-divider>
        <h3 class="sub-title">Product Barcode Lookup</h3>
        <div class="search-wrap" style="max-width:400px">
          <mat-icon class="search-icon">search</mat-icon>
          <input class="search-input" [(ngModel)]="barcodeSearch"
            (input)="onBarcodeSearch()" placeholder="Scan or type barcode / name" />
        </div>

        <div class="barcode-grid mt-16">
          @for (p of barcodePageProducts; track p.id) {
            <div class="barcode-card" (click)="selectBarcodeProduct(p)">
              <div class="bc-name">{{ p.name }}</div>
              <div class="bc-cat text-muted text-sm">{{ p.category }}</div>
              <img [src]="inventorySvc.getBarcodeImageUrl(p.barcode, 200, 60)"
                   [alt]="p.barcode" class="bc-img" loading="lazy" />
              <div class="bc-val mono">{{ p.barcode }}</div>
              <div class="bc-price bold">₹{{ p.price | number:'1.0-0' }}</div>
            </div>
          }
          @if (barcodePageProducts.length === 0) {
            <p class="empty-msg">Search for products above.</p>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .page-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 20px; color: #2c1a00; }

    /* Tabs */
    .tabs { display: flex; gap: 6px; margin-bottom: 24px; flex-wrap: wrap; }
    .tabs button { display: flex; align-items: center; gap: 5px; padding: 8px 14px; border-radius: 8px;
                   background: #f0e8d8; color: #3e2000; font-weight: 500; font-size: .85rem;
                   border: none; cursor: pointer; white-space: nowrap; }
    .tabs button.active { background: #805500; color: #fff; }
    .tabs button mat-icon { font-size: 17px; width: 17px; height: 17px; }

    /* Cards */
    .section-card { background: #fff; border-radius: 12px; padding: 24px;
                    box-shadow: 0 2px 12px rgba(128,85,0,.1); margin-bottom: 20px; }
    .section-header { display: flex; justify-content: space-between; align-items: center;
                      flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
    h2 { font-size: 1.1rem; font-weight: 700; color: #2c1a00; margin: 0 0 8px; }
    .sub-title { font-size: .95rem; font-weight: 700; color: #3e2000; margin: 0 0 10px; }
    .hint-text { color: #8a7560; font-size: .88rem; margin-bottom: 12px; }
    .empty-msg { color: #8a7560; font-style: italic; }
    .text-muted { color: #8a7560; } .text-sm { font-size: .8rem; } .bold { font-weight: 600; }
    .mono { font-family: 'Courier New', monospace; font-size: .82rem; }
    .mt-16 { margin-top: 16px; }

    /* KPIs */
    .kpi-row { display: flex; gap: 14px; flex-wrap: wrap; }
    .kpi-box { flex: 1; min-width: 130px; background: #f0e8d8; border-radius: 10px; padding: 16px 12px;
               text-align: center; }
    .kpi-box.warn   { background: #fff3cd; }
    .kpi-box.danger { background: #fdecea; }
    .kpi-box.green  { background: #d5f5e3; }
    .kpi-val { font-size: 1.4rem; font-weight: 800; color: #2c1a00; }
    .kpi-lbl { font-size: .75rem; color: #8a7560; margin-top: 4px; }

    .cat-chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .cat-chip { background: #f0e8d8; color: #3e2000; padding: 4px 12px; border-radius: 12px;
                font-size: .8rem; cursor: pointer; border: 1px solid #e0c898; }
    .cat-chip:hover { background: #805500; color: #fff; }

    .quick-actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    .quick-actions a.btn { display: flex; align-items: center; gap: 6px;
                            padding: 8px 14px; border-radius: 6px; text-decoration: none;
                            border: 2px solid #805500; color: #805500; font-size: .9rem; cursor: pointer; }
    .btn-brown { background: #805500 !important; color: #fff !important; }
    .btn-outline { border: 2px solid #805500; color: #805500 !important; background: transparent !important; }
    .btn-lg { height: 48px; }

    /* Filter bar */
    .filter-bar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-bottom: 16px; }
    .search-wrap { display: flex; align-items: center; border: 1px solid #d4c4a8; border-radius: 8px;
                   padding: 0 10px; flex: 1; min-width: 200px; }
    .search-icon { color: #8a7560; margin-right: 6px; font-size: 18px; }
    .search-input { border: none; outline: none; flex: 1; padding: 8px 0; font-size: .9rem; }
    .header-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .selection-count { font-size: .85rem; font-weight: 600; color: #805500; }

    /* Table */
    .table-wrap { overflow-x: auto; border-radius: 8px; border: 1px solid #e0c898; }
    .inv-table { width: 100%; border-collapse: collapse; font-size: .87rem; }
    .inv-table th { background: #fdf7ee; padding: 10px 12px; text-align: left; border-bottom: 2px solid #e0c898;
                    font-weight: 700; color: #2c1a00; white-space: nowrap; }
    .inv-table td { padding: 8px 12px; border-bottom: 1px solid #f0e8d8; vertical-align: middle; }
    .inv-table tr:last-child td { border-bottom: none; }
    .inv-table tr:hover td { background: #fdf9f5; }
    .row-selected td { background: #fef7e8 !important; }
    .row-lowstock td { background: #fff9e8; }
    .row-outstock td { background: #fef2f0; }
    .sortable { cursor: pointer; user-select: none; }
    .sortable:hover { color: #805500; }
    .sort-icon { font-size: 14px !important; width: 14px !important; height: 14px !important;
                 vertical-align: middle; color: #8a7560; }
    .num-col { text-align: right; }
    .action-cell { white-space: nowrap; }
    .loading-cell { padding: 0 !important; }
    .empty-cell { text-align: center; color: #8a7560; padding: 24px !important; font-style: italic; }
    .stock-low { color: #e08c00; font-weight: 700; }
    .stock-out { color: #c62828; font-weight: 700; }

    .cat-badge { background: #f0e8d8; color: #3e2000; padding: 2px 7px; border-radius: 8px; font-size: .74rem; }
    .status-badge { padding: 2px 8px; border-radius: 8px; font-size: .72rem; font-weight: 700; text-transform: uppercase; }
    .status-active       { background: #d5f5e3; color: #1a7a3c; }
    .status-inactive     { background: #fff3cd; color: #856404; }
    .status-discontinued { background: #fdecea; color: #c62828; }

    /* Pagination */
    .pagination { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 0 0; }
    .page-info { font-size: .85rem; color: #3e2000; }

    /* Edit form */
    .form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; margin-bottom: 12px; }
    .form-actions { display: flex; gap: 10px; }

    /* Stock Adjust */
    .adj-grid { max-width: 700px; }
    .adj-results { background: #fdf9f5; border: 1px solid #e0c898; border-radius: 8px; }
    .adj-result-row { display: flex; gap: 12px; align-items: center; padding: 10px 14px;
                      cursor: pointer; border-bottom: 1px solid #f0e8d8; }
    .adj-result-row:hover { background: #f0e8d8; }
    .adj-result-row:last-child { border-bottom: none; }
    .adj-selected { display: flex; align-items: center; gap: 10px; background: #f0e8d8;
                    border-radius: 8px; padding: 10px 14px; }
    .adj-selected mat-icon { color: #805500; }
    .adj-selected > div { flex: 1; }
    .adj-preview { display: flex; align-items: center; gap: 8px; padding: 12px 16px;
                   border-radius: 8px; font-weight: 600; }
    .preview-pos { background: #d5f5e3; color: #1a7a3c; }
    .preview-neg { background: #fdecea; color: #c62828; }

    /* Audit */
    .delta-pos { color: #1a7a3c; font-weight: 700; }
    .delta-neg { color: #c62828; font-weight: 700; }
    .reason-badge { padding: 2px 6px; border-radius: 6px; font-size: .72rem; font-weight: 700; background: #f0e8d8; color: #3e2000; }
    .reason-sale, .reason-manual_remove { background: #fdecea; color: #c62828; }
    .reason-return, .reason-purchase, .reason-manual_add, .reason-bulk_import { background: #d5f5e3; color: #1a7a3c; }
    .reason-exchange, .reason-audit_correction { background: #fff3cd; color: #856404; }

    /* History */
    .history-card { border: 1px solid #e0c898; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px; }

    /* Import */
    .import-steps { display: flex; flex-direction: column; gap: 20px; max-width: 700px; }
    .step { display: flex; gap: 16px; }
    .step-num { width: 32px; height: 32px; min-width: 32px; border-radius: 50%; background: #805500;
                color: #fff; font-weight: 700; display: flex; align-items: center; justify-content: center; }
    .step-body { flex: 1; }
    .step-title { font-weight: 700; color: #2c1a00; margin-bottom: 4px; }
    .step-desc { font-size: .85rem; color: #8a7560; margin-bottom: 10px; }
    .file-drop { border: 2px dashed #d4c4a8; border-radius: 10px; padding: 28px 20px;
                 display: flex; align-items: center; gap: 12px; cursor: pointer; flex-wrap: wrap;
                 text-align: center; justify-content: center; }
    .file-drop:hover { border-color: #805500; background: #fdf9f5; }
    .import-result { background: #fdf9f5; border: 1px solid #e0c898; border-radius: 10px;
                     padding: 16px 20px; margin-top: 20px; }
    .import-result.has-errors { border-color: #f5c6c6; }
    .result-row { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
    .result-icon { font-size: 1.1rem; }
    .error-row { font-size: .82rem; color: #c62828; padding: 3px 8px; background: #fdecea;
                 border-radius: 4px; margin-bottom: 3px; }
    .danger { color: #c62828; }
    .green  { color: #1a7a3c; }

    /* Barcodes */
    .barcode-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
    .barcode-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; }
    .barcode-card { border: 1px solid #e0c898; border-radius: 10px; padding: 12px; text-align: center;
                    cursor: pointer; background: #fff; }
    .barcode-card:hover { border-color: #805500; background: #fdf9f5; }
    .bc-name { font-weight: 600; font-size: .85rem; color: #2c1a00; }
    .bc-cat  { margin: 2px 0 4px; }
    .bc-img  { max-width: 100%; height: 50px; }
    .bc-val  { font-size: .72rem; margin-top: 2px; }
    .bc-price { color: #805500; font-size: .88rem; }
    .barcode-panel .barcode-display { max-width: 320px; margin: 0 auto; border: 1px solid #e0c898;
                                      border-radius: 8px; padding: 14px; }

    @media print {
      body > *:not(#barcode-print-area) { display: none !important; }
      #barcode-print-area { display: block !important; }
    }

    @media (max-width: 700px) {
      .inv-table th:nth-child(n+7) { display: none; }
      .inv-table td:nth-child(n+7) { display: none; }
    }
  `]
})
export class InventoryComponent implements OnInit {

  tab: Tab = 'dashboard';
  summary: InventorySummary | null = null;

  // ── Product list state ───────────────────────────────────────────────────
  pagedResult: PagedResponse<Product> | null = null;
  currentPage = 0;
  pageSize = 50;
  sortCol = 'name';
  sortDir = 'asc';
  searchQ = '';
  filterCategory = '';
  filterStatus = '';
  loading = false;
  selectedIds = new Set<number>();
  bulkStatus = 'INACTIVE';

  // ── Edit product form ────────────────────────────────────────────────────
  editingProduct: Product | null = null;
  editForm: InventoryProductRequest = this.emptyForm();
  formSaving = false;

  // ── Stock history ────────────────────────────────────────────────────────
  historyProduct: Product | null = null;
  stockHistory: StockAdjustment[] = [];

  // ── Barcode panel ────────────────────────────────────────────────────────
  barcodeProduct: Product | null = null;
  barcodeSearch = '';
  barcodePageProducts: Product[] = [];

  // ── Stock adjustment ─────────────────────────────────────────────────────
  adjSearch = '';
  adjResults: Product[] = [];
  adjProduct: Product | null = null;
  adjDelta: number = 0;
  adjReason = 'MANUAL_ADD';
  adjNote = '';
  adjSaving = false;
  adjSearchTimer: any;

  // ── Audit ────────────────────────────────────────────────────────────────
  auditFrom = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  auditTo   = new Date().toISOString().slice(0, 10);
  auditRows: StockAdjustment[] = [];

  // ── Import ───────────────────────────────────────────────────────────────
  importFile: File | null = null;
  importSaving = false;
  importResult: ImportResult | null = null;

  readonly tabDefs = [
    { id: 'dashboard' as Tab, label: 'Dashboard',  icon: 'dashboard' },
    { id: 'products'  as Tab, label: 'Products',   icon: 'inventory_2' },
    { id: 'lowstock'  as Tab, label: 'Low Stock',  icon: 'warning' },
    { id: 'adjust'    as Tab, label: 'Adjust Stock', icon: 'tune' },
    { id: 'audit'     as Tab, label: 'Audit Trail', icon: 'history' },
    { id: 'import'    as Tab, label: 'Import Excel', icon: 'upload_file' },
    { id: 'barcodes'  as Tab, label: 'Barcodes',   icon: 'qr_code' },
  ];

  get allSelected(): boolean {
    const content = this.pagedResult?.content ?? [];
    return content.length > 0 && content.every(p => this.selectedIds.has(p.id));
  }

  constructor(
    public inventorySvc: InventoryService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSummary();
  }

  onTabChange(): void {
    if (this.tab === 'products' || this.tab === 'lowstock') {
      this.loadPage(0);
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────

  loadSummary(): void {
    this.inventorySvc.getSummary().subscribe({
      next: s => { this.summary = s; this.cdr.markForCheck(); },
      error: () => {}
    });
  }

  filterByCategory(cat: string): void {
    this.filterCategory = cat;
    this.tab = 'products';
    this.loadPage(0);
  }

  generateMissingBarcodes(): void {
    this.inventorySvc.generateMissingBarcodes().subscribe({
      next: r => {
        this.toast.success(`Generated barcodes for ${r.updatedCount} products`);
        this.loadSummary();
      },
      error: () => this.toast.error('Failed')
    });
  }

  // ── Product list ─────────────────────────────────────────────────────────

  loadPage(page: number): void {
    this.currentPage = page;
    this.loading = true;
    this.selectedIds.clear();

    let obs$;
    if (this.tab === 'lowstock') {
      obs$ = this.inventorySvc.listLowStock(page, this.pageSize);
    } else if (this.searchQ.trim().length >= 2) {
      obs$ = this.inventorySvc.searchProducts(this.searchQ.trim(), page, this.pageSize);
    } else if (this.filterCategory) {
      obs$ = this.inventorySvc.listByCategory(this.filterCategory, page, this.pageSize);
    } else {
      obs$ = this.inventorySvc.listProducts(page, this.pageSize, this.sortCol, this.sortDir);
    }

    obs$.subscribe({
      next: r => { this.pagedResult = r; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  sortBy(col: string): void {
    if (this.sortCol === col) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortCol = col;
      this.sortDir = 'asc';
    }
    this.loadPage(0);
  }

  searchTimer: any;
  onSearch(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadPage(0), 350);
  }

  toggleSelect(id: number, checked: boolean): void {
    if (checked) this.selectedIds.add(id);
    else this.selectedIds.delete(id);
    this.cdr.markForCheck();
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      (this.pagedResult?.content ?? []).forEach(p => this.selectedIds.add(p.id));
    } else {
      this.selectedIds.clear();
    }
    this.cdr.markForCheck();
  }

  applyBulkStatus(): void {
    if (this.selectedIds.size === 0) return;
    this.inventorySvc.bulkUpdateStatus({ productIds: [...this.selectedIds], status: this.bulkStatus })
      .subscribe({
        next: r => {
          this.toast.success(`${r.updatedCount} products updated to ${this.bulkStatus}`);
          this.selectedIds.clear();
          this.loadPage(this.currentPage);
        },
        error: () => this.toast.error('Bulk update failed')
      });
  }

  exportSelectedBarcodes(): void {
    const url = this.inventorySvc.exportBarcodesExcelUrl([...this.selectedIds]);
    window.open(url, '_blank');
  }

  // ── Edit form ─────────────────────────────────────────────────────────────

  openAddProduct(): void {
    this.editingProduct = {} as Product;
    this.editForm = this.emptyForm();
  }

  openEdit(p: Product): void {
    this.editingProduct = p;
    this.editForm = {
      id: p.id, name: p.name, description: p.description, category: p.category,
      price: p.price, costPrice: p.costPrice, stock: p.stock, reorderLevel: p.reorderLevel,
      imageUrl: p.imageUrl, barcode: p.barcode, sku: p.sku, status: p.status || 'ACTIVE',
      supplier: p.supplier, discountType: p.discountType, discountValue: p.discountValue
    };
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  saveProduct(): void {
    if (!this.editForm.name || !this.editForm.category || !this.editForm.price) {
      this.toast.error('Name, category and price are required'); return;
    }
    this.formSaving = true;
    const obs$ = this.editForm.id
      ? this.inventorySvc.updateProduct(this.editForm.id!, this.editForm)
      : this.inventorySvc.createProduct(this.editForm);
    obs$.subscribe({
      next: () => {
        this.formSaving = false;
        this.toast.success(this.editForm.id ? 'Product updated' : 'Product created');
        this.editingProduct = null;
        this.loadPage(this.currentPage);
        this.loadSummary();
        this.cdr.markForCheck();
      },
      error: err => {
        this.formSaving = false;
        this.toast.error(err.error?.message || 'Save failed');
        this.cdr.markForCheck();
      }
    });
  }

  // ── Stock history ─────────────────────────────────────────────────────────

  openHistory(p: Product): void {
    this.historyProduct = p;
    this.inventorySvc.getStockHistory(p.id).subscribe({
      next: h => { this.stockHistory = h; this.cdr.markForCheck(); },
      error: () => this.toast.error('Failed to load history')
    });
  }

  // ── Barcode print ─────────────────────────────────────────────────────────

  printBarcode(p: Product): void {
    this.barcodeProduct = p;
    setTimeout(() => window.print(), 300);
  }

  selectBarcodeProduct(p: Product): void {
    this.barcodeProduct = p;
    setTimeout(() => window.print(), 300);
  }

  onBarcodeSearch(): void {
    if (this.barcodeSearch.length < 2) { this.barcodePageProducts = []; return; }
    this.inventorySvc.searchProducts(this.barcodeSearch, 0, 24).subscribe({
      next: r => { this.barcodePageProducts = r.content; this.cdr.markForCheck(); },
      error: () => {}
    });
  }

  // ── Stock Adjust ──────────────────────────────────────────────────────────

  openAdjust(p: Product): void {
    this.tab = 'adjust';
    this.adjProduct = p;
    this.adjSearch = p.name;
    this.adjDelta = 0;
  }

  searchForAdj(): void {
    clearTimeout(this.adjSearchTimer);
    if (this.adjSearch.length < 2) { this.adjResults = []; return; }
    this.adjSearchTimer = setTimeout(() => {
      this.inventorySvc.searchProducts(this.adjSearch, 0, 10).subscribe({
        next: r => { this.adjResults = r.content; this.cdr.markForCheck(); },
        error: () => {}
      });
    }, 300);
  }

  selectAdjProduct(p: Product): void {
    this.adjProduct = p;
    this.adjResults = [];
    this.cdr.markForCheck();
  }

  submitAdjustment(): void {
    if (!this.adjProduct || this.adjDelta === 0) return;
    this.adjSaving = true;
    const req: StockAdjustRequest = {
      productId: this.adjProduct.id,
      quantityDelta: this.adjDelta,
      reason: this.adjReason,
      note: this.adjNote
    };
    this.inventorySvc.adjustStock(req).subscribe({
      next: a => {
        this.adjSaving = false;
        this.toast.success(`Stock updated: ${a.stockBefore} → ${a.stockAfter}`);
        this.adjProduct!.stock = a.stockAfter;
        this.adjDelta = 0;
        this.adjNote = '';
        this.loadSummary();
        this.cdr.markForCheck();
      },
      error: err => {
        this.adjSaving = false;
        this.toast.error(err.error?.message || 'Adjustment failed');
        this.cdr.markForCheck();
      }
    });
  }

  // ── Audit ─────────────────────────────────────────────────────────────────

  loadAudit(): void {
    this.inventorySvc.getStockHistoryRange(this.auditFrom, this.auditTo).subscribe({
      next: r => { this.auditRows = r; this.cdr.markForCheck(); },
      error: () => this.toast.error('Failed to load audit')
    });
  }

  // ── Import ────────────────────────────────────────────────────────────────

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) { this.importFile = input.files[0]; this.cdr.markForCheck(); }
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files?.[0]) { this.importFile = event.dataTransfer.files[0]; this.cdr.markForCheck(); }
  }

  uploadImport(): void {
    if (!this.importFile) return;
    this.importSaving = true;
    this.inventorySvc.importExcel(this.importFile).subscribe({
      next: r => {
        this.importSaving = false;
        this.importResult = r;
        this.toast.success(`Import done: ${r.created} created, ${r.updated} updated`);
        this.loadSummary();
        this.cdr.markForCheck();
      },
      error: err => {
        this.importSaving = false;
        this.toast.error(err.error?.message || 'Import failed');
        this.cdr.markForCheck();
      }
    });
  }

  private emptyForm(): InventoryProductRequest {
    return { name: '', category: '', price: 0, costPrice: undefined, stock: 0,
             reorderLevel: 5, status: 'ACTIVE', barcode: '', sku: '' };
  }
}
