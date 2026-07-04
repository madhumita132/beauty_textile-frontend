import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { DiscountService } from '../../../services/discount.service';
import { CategoryService } from '../../../services/category.service';
import { ProductService } from '../../../services/product.service';
import { ToastService } from '../../../services/toast.service';
import { Category, Offer, OfferRequest, Product } from '../../../models/models';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

type AdminTab = 'offers' | 'product' | 'category' | 'global';

@Component({
  selector: 'app-discounts',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, DecimalPipe,
    MatIconModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDividerModule,
    MatChipsModule, MatSlideToggleModule, MatTooltipModule
  ],
  template: `
    <h1 class="page-title">Discount Management</h1>

    <!-- Tabs -->
    <div class="tabs">
      <button [class.active]="tab==='offers'"   (click)="tab='offers'">
        <mat-icon>local_offer</mat-icon> Festival Offers
      </button>
      <button [class.active]="tab==='product'"  (click)="tab='product'">
        <mat-icon>inventory_2</mat-icon> Product Discount
      </button>
      <button [class.active]="tab==='category'" (click)="tab='category'">
        <mat-icon>category</mat-icon> Category Discount
      </button>
      <button [class.active]="tab==='global'"   (click)="tab='global'">
        <mat-icon>store</mat-icon> Global Discount
      </button>
    </div>

    <!-- ════════════════════════════════════════════════════════
         TAB 1 – Festival Offers
    ════════════════════════════════════════════════════════ -->
    @if (tab === 'offers') {
      <div class="section-card">
        <div class="section-header">
          <h2>Festival Offers</h2>
          @if (!showOfferForm) {
            <button mat-raised-button (click)="openOfferForm()"
              style="background:#805500!important;color:#fff!important">
              <mat-icon>add</mat-icon> New Offer
            </button>
          }
        </div>

        @if (showOfferForm) {
          <div class="form-box">
            <h3 class="form-title">{{ editingOffer ? 'Edit Offer' : 'Create Offer' }}</h3>
            <div class="two-col">
              <mat-form-field appearance="outline" style="flex:1">
                <mat-label>Offer Name *</mat-label>
                <mat-icon matPrefix>celebration</mat-icon>
                <input matInput [(ngModel)]="offerForm.offerName" placeholder="e.g. Diwali Sale 2026" />
              </mat-form-field>
              <mat-form-field appearance="outline" style="flex:1">
                <mat-label>Scope *</mat-label>
                <mat-select [(ngModel)]="offerForm.offerScope">
                  <mat-option value="GLOBAL">Global (All Products)</mat-option>
                  <mat-option value="CATEGORY">Category</mat-option>
                  <mat-option value="PRODUCT">Single Product</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            @if (offerForm.offerScope === 'CATEGORY') {
              <mat-form-field appearance="outline" style="width:100%">
                <mat-label>Category *</mat-label>
                <mat-select [(ngModel)]="offerForm.categoryName">
                  @for (c of categories; track c.id) {
                    <mat-option [value]="c.name">{{ c.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            }

            @if (offerForm.offerScope === 'PRODUCT') {
              <mat-form-field appearance="outline" style="width:100%">
                <mat-label>Product *</mat-label>
                <mat-select [(ngModel)]="offerForm.productId">
                  @for (p of products; track p.id) {
                    <mat-option [value]="p.id">{{ p.name }} (₹{{ p.originalPrice }})</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            }

            <div class="two-col">
              <mat-form-field appearance="outline" style="flex:1">
                <mat-label>Discount Type *</mat-label>
                <mat-select [(ngModel)]="offerForm.discountType">
                  <mat-option value="PERCENTAGE">Percentage (%)</mat-option>
                  <mat-option value="FIXED">Fixed Amount (₹)</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" style="flex:1">
                <mat-label>{{ offerForm.discountType === 'PERCENTAGE' ? 'Discount %' : 'Discount ₹' }}</mat-label>
                <mat-icon matPrefix>{{ offerForm.discountType === 'PERCENTAGE' ? 'percent' : 'currency_rupee' }}</mat-icon>
                <input matInput type="number" [(ngModel)]="offerForm.discountValue" min="0" />
              </mat-form-field>
            </div>

            <div class="two-col">
              <mat-form-field appearance="outline" style="flex:1">
                <mat-label>Start Date *</mat-label>
                <mat-icon matPrefix>event</mat-icon>
                <input matInput type="date" [(ngModel)]="offerForm.startDate" />
              </mat-form-field>
              <mat-form-field appearance="outline" style="flex:1">
                <mat-label>End Date *</mat-label>
                <mat-icon matPrefix>event_busy</mat-icon>
                <input matInput type="date" [(ngModel)]="offerForm.endDate" />
              </mat-form-field>
            </div>

            <div class="toggle-row">
              <mat-slide-toggle [(ngModel)]="offerForm.active" color="primary">
                Active
              </mat-slide-toggle>
            </div>

            <div class="form-actions">
              <button mat-raised-button (click)="saveOffer()" [disabled]="savingOffer"
                style="background:#805500!important;color:#fff!important">
                {{ savingOffer ? 'Saving...' : (editingOffer ? 'Update Offer' : 'Create Offer') }}
              </button>
              <button mat-stroked-button (click)="cancelOfferForm()">Cancel</button>
            </div>
          </div>
        }

        <!-- Offers list -->
        <div class="offers-list mt-16">
          @for (o of offers; track o.id) {
            <div class="offer-card" [class.expired]="!o.currentlyActive && !o.active">
              <div class="offer-header">
                <div class="offer-icon">🎉</div>
                <div class="offer-info">
                  <div class="offer-name">{{ o.offerName }}</div>
                  <div class="offer-meta">
                    <span class="scope-badge scope-{{ o.offerScope.toLowerCase() }}">{{ o.offerScope }}</span>
                    @if (o.categoryName) { <span class="text-muted text-sm">· {{ o.categoryName }}</span> }
                    <span class="discount-chip">
                      {{ o.discountType === 'PERCENTAGE' ? o.discountValue + '% OFF' : '₹' + o.discountValue + ' OFF' }}
                    </span>
                  </div>
                  <div class="offer-dates">
                    {{ o.startDate }} → {{ o.endDate }}
                    @if (o.currentlyActive) { <span class="badge-live">🟢 LIVE</span> }
                    @else if (o.active) { <span class="badge-scheduled">🕐 Scheduled</span> }
                    @else { <span class="badge-off">⏸ Paused</span> }
                  </div>
                </div>
                <div class="offer-actions">
                  <button mat-icon-button (click)="editOffer(o)" matTooltip="Edit">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button (click)="toggleOffer(o)" [matTooltip]="o.active ? 'Pause' : 'Activate'">
                    <mat-icon>{{ o.active ? 'pause_circle' : 'play_circle' }}</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteOffer(o.id)" matTooltip="Delete">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
            </div>
          }
          @if (offers.length === 0) {
            <p class="empty-msg">No offers yet. Create your first festival offer above.</p>
          }
        </div>
      </div>
    }

    <!-- ════════════════════════════════════════════════════════
         TAB 2 – Product Discount
    ════════════════════════════════════════════════════════ -->
    @if (tab === 'product') {
      <div class="section-card">
        <h2>Product-Level Discount</h2>
        <p class="hint-text">Set a permanent discount on specific products. Overrides category and global discounts.</p>

        <div class="discount-form-row">
          <mat-form-field appearance="outline" style="flex:2">
            <mat-label>Select Product</mat-label>
            <mat-select [(ngModel)]="pdProductId">
              @for (p of products; track p.id) {
                <mat-option [value]="p.id">
                  {{ p.name }}
                  @if ((p.discountAmount || 0) > 0) { <span style="color:#805500"> · {{ p.discountLabel }}</span> }
                </mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" style="flex:1">
            <mat-label>Type</mat-label>
            <mat-select [(ngModel)]="pdType">
              <mat-option value="NONE">No Discount</mat-option>
              <mat-option value="PERCENTAGE">Percentage (%)</mat-option>
              <mat-option value="FIXED">Fixed (₹)</mat-option>
            </mat-select>
          </mat-form-field>
          @if (pdType !== 'NONE') {
            <mat-form-field appearance="outline" style="flex:1">
              <mat-label>{{ pdType === 'PERCENTAGE' ? 'Discount %' : 'Discount ₹' }}</mat-label>
              <input matInput type="number" [(ngModel)]="pdValue" min="0" />
            </mat-form-field>
          }
          <button mat-raised-button (click)="applyProductDiscount()" [disabled]="!pdProductId"
            style="background:#805500!important;color:#fff!important;height:56px;margin-top:4px">
            Apply
          </button>
        </div>

        <!-- Products with active discounts -->
        <mat-divider style="margin:20px 0"></mat-divider>
        <h3 class="sub-title">Products with Active Discounts</h3>
        <div class="discounted-list">
          @for (p of productsWithDiscount; track p.id) {
            <div class="discounted-row">
              <span class="d-name">{{ p.name }}</span>
              <span class="d-cat text-muted text-sm">{{ p.category }}</span>
              <span class="d-orig">₹{{ p.originalPrice | number:'1.0-0' }}</span>
              <span class="d-badge">{{ p.discountLabel }}</span>
              <span class="d-final">₹{{ p.finalPrice | number:'1.0-0' }}</span>
              <button mat-icon-button color="warn" (click)="clearProductDiscount(p.id)" matTooltip="Remove discount">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          }
          @if (productsWithDiscount.length === 0) {
            <p class="empty-msg">No product-level discounts set.</p>
          }
        </div>
      </div>
    }

    <!-- ════════════════════════════════════════════════════════
         TAB 3 – Category Discount
    ════════════════════════════════════════════════════════ -->
    @if (tab === 'category') {
      <div class="section-card">
        <h2>Category-Level Discount</h2>
        <p class="hint-text">Discount applies to all products in the chosen category.</p>

        <div class="discount-form-row">
          <mat-form-field appearance="outline" style="flex:2">
            <mat-label>Select Category</mat-label>
            <mat-select [(ngModel)]="cdCategory">
              @for (c of categories; track c.id) {
                <mat-option [value]="c.name">{{ c.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" style="flex:1">
            <mat-label>Type</mat-label>
            <mat-select [(ngModel)]="cdType">
              <mat-option value="NONE">No Discount</mat-option>
              <mat-option value="PERCENTAGE">Percentage (%)</mat-option>
              <mat-option value="FIXED">Fixed (₹)</mat-option>
            </mat-select>
          </mat-form-field>
          @if (cdType !== 'NONE') {
            <mat-form-field appearance="outline" style="flex:1">
              <mat-label>{{ cdType === 'PERCENTAGE' ? 'Discount %' : 'Discount ₹' }}</mat-label>
              <input matInput type="number" [(ngModel)]="cdValue" min="0" />
            </mat-form-field>
          }
          <button mat-raised-button (click)="applyCategoryDiscount()" [disabled]="!cdCategory"
            style="background:#805500!important;color:#fff!important;height:56px;margin-top:4px">
            Apply
          </button>
        </div>
      </div>
    }

    <!-- ════════════════════════════════════════════════════════
         TAB 4 – Global Discount
    ════════════════════════════════════════════════════════ -->
    @if (tab === 'global') {
      <div class="section-card">
        <h2>Store-Wide Discount</h2>
        <p class="hint-text">Creates a GLOBAL offer valid today. Applies to all products when no product or category discount exists.</p>

        <div class="global-form">
          <div class="two-col">
            <mat-form-field appearance="outline" style="flex:1">
              <mat-label>Offer Name *</mat-label>
              <mat-icon matPrefix>store</mat-icon>
              <input matInput [(ngModel)]="globalName" placeholder="e.g. Weekend Sale" />
            </mat-form-field>
            <mat-form-field appearance="outline" style="flex:1">
              <mat-label>Discount Type *</mat-label>
              <mat-select [(ngModel)]="globalType">
                <mat-option value="PERCENTAGE">Percentage (%)</mat-option>
                <mat-option value="FIXED">Fixed Amount (₹)</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <div class="two-col">
            <mat-form-field appearance="outline" style="flex:1">
              <mat-label>{{ globalType === 'PERCENTAGE' ? 'Discount %' : 'Discount ₹' }}</mat-label>
              <mat-icon matPrefix>{{ globalType === 'PERCENTAGE' ? 'percent' : 'currency_rupee' }}</mat-icon>
              <input matInput type="number" [(ngModel)]="globalValue" min="0" />
            </mat-form-field>
            <mat-form-field appearance="outline" style="flex:1">
              <mat-label>End Date *</mat-label>
              <mat-icon matPrefix>event_busy</mat-icon>
              <input matInput type="date" [(ngModel)]="globalEnd" />
            </mat-form-field>
          </div>
          <button mat-raised-button (click)="applyGlobal()" [disabled]="!globalName || !globalValue"
            style="background:#805500!important;color:#fff!important;height:48px">
            🌐 Apply to Entire Store
          </button>
        </div>

        <!-- Active global offers -->
        <mat-divider style="margin:20px 0"></mat-divider>
        <h3 class="sub-title">Active Global Offers</h3>
        @for (o of globalOffers; track o.id) {
          <div class="offer-card">
            <div class="offer-header">
              <div class="offer-icon">🌐</div>
              <div class="offer-info">
                <div class="offer-name">{{ o.offerName }}</div>
                <div class="offer-meta">
                  <span class="discount-chip">
                    {{ o.discountType === 'PERCENTAGE' ? o.discountValue + '% OFF' : '₹' + o.discountValue + ' OFF' }}
                  </span>
                  <span class="text-muted text-sm">Until {{ o.endDate }}</span>
                  @if (o.currentlyActive) { <span class="badge-live">🟢 LIVE</span> }
                </div>
              </div>
              <div class="offer-actions">
                <button mat-icon-button (click)="toggleOffer(o)">
                  <mat-icon>{{ o.active ? 'pause_circle' : 'play_circle' }}</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deleteOffer(o.id)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          </div>
        }
        @if (globalOffers.length === 0) {
          <p class="empty-msg">No global offers active.</p>
        }
      </div>
    }
  `,
  styles: [`
    .page-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 20px; color: #2c1a00; }

    .tabs { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
    .tabs button { display: flex; align-items: center; gap: 6px; padding: 10px 18px; border-radius: 8px;
                   background: #f0e8d8; color: #3e2000; font-weight: 500; font-size: .9rem; border: none; cursor: pointer; }
    .tabs button.active { background: #805500; color: #fff; }
    .tabs button mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .section-card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 12px rgba(128,85,0,.1); }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .section-header h2, h2 { font-size: 1.1rem; font-weight: 700; color: #2c1a00; margin: 0 0 8px; }
    .sub-title { font-size: .95rem; font-weight: 700; color: #3e2000; margin: 0 0 12px; }
    .hint-text { color: #8a7560; font-size: .88rem; margin-bottom: 20px; }
    .empty-msg { color: #8a7560; font-style: italic; padding: 12px 0; }
    .mt-16 { margin-top: 16px; }

    .form-box { background: #fdf9f5; border: 1px solid #e0c898; border-radius: 10px; padding: 20px; margin-bottom: 20px; }
    .form-title { font-weight: 700; color: #2c1a00; margin: 0 0 16px; font-size: 1rem; }
    .two-col { display: flex; gap: 16px; flex-wrap: wrap; }
    .form-actions { display: flex; gap: 10px; margin-top: 8px; }
    .toggle-row { margin: 8px 0; }

    /* Offer cards */
    .offers-list { display: flex; flex-direction: column; gap: 10px; }
    .offer-card { border: 1px solid #e0c898; border-radius: 10px; padding: 14px 18px; background: #fff; }
    .offer-card.expired { opacity: .6; }
    .offer-header { display: flex; align-items: center; gap: 14px; }
    .offer-icon { font-size: 1.6rem; }
    .offer-info { flex: 1; }
    .offer-name { font-weight: 700; color: #2c1a00; font-size: .95rem; }
    .offer-meta { display: flex; align-items: center; gap: 8px; margin: 4px 0; flex-wrap: wrap; }
    .offer-dates { font-size: .8rem; color: #8a7560; }
    .offer-actions { display: flex; gap: 2px; }

    .scope-badge { padding: 2px 8px; border-radius: 10px; font-size: .72rem; font-weight: 700; text-transform: uppercase; }
    .scope-global   { background: #e8d5b0; color: #3e2000; }
    .scope-category { background: #d5eaf8; color: #1a4a7a; }
    .scope-product  { background: #d5f5e3; color: #1a7a3c; }

    .discount-chip { background: #fdecea; color: #c62828; padding: 2px 10px; border-radius: 10px; font-size: .78rem; font-weight: 700; }
    .badge-live      { color: #27ae60; font-size: .8rem; font-weight: 700; }
    .badge-scheduled { color: #e08c00; font-size: .8rem; font-weight: 700; }
    .badge-off       { color: #8a7560; font-size: .8rem; }

    /* Product discount */
    .discount-form-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-start; }
    .discounted-list { display: flex; flex-direction: column; gap: 6px; }
    .discounted-row { display: flex; align-items: center; gap: 12px; padding: 10px 14px;
                      background: #fdf9f5; border-radius: 8px; border: 1px solid #ede4d4; flex-wrap: wrap; }
    .d-name { flex: 1; min-width: 120px; font-weight: 600; font-size: .9rem; }
    .d-cat  { min-width: 80px; }
    .d-orig { text-decoration: line-through; color: #8a7560; }
    .d-badge { background: #fdecea; color: #c62828; padding: 2px 8px; border-radius: 8px; font-size: .78rem; font-weight: 700; }
    .d-final { font-weight: 700; color: #805500; }

    /* Global form */
    .global-form { max-width: 700px; }
  `]
})
export class DiscountsComponent implements OnInit {
  tab: AdminTab = 'offers';

  // ── Offers ─────────────────────────────────────────────────────────────
  offers: Offer[] = [];
  showOfferForm = false;
  editingOffer: Offer | null = null;
  savingOffer = false;
  offerForm: OfferRequest = this.emptyOfferForm();

  // ── Product discount ────────────────────────────────────────────────────
  products: Product[] = [];
  pdProductId: number | null = null;
  pdType = 'PERCENTAGE';
  pdValue = 10;

  // ── Category discount ───────────────────────────────────────────────────
  categories: Category[] = [];
  cdCategory = '';
  cdType = 'PERCENTAGE';
  cdValue = 10;

  // ── Global ──────────────────────────────────────────────────────────────
  globalName = '';
  globalType = 'PERCENTAGE';
  globalValue = 10;
  globalEnd = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  get productsWithDiscount(): Product[] {
    return this.products.filter(p => (p.discountAmount || 0) > 0);
  }

  get globalOffers(): Offer[] {
    return this.offers.filter(o => o.offerScope === 'GLOBAL');
  }

  constructor(
    private discountSvc: DiscountService,
    private categorySvc: CategoryService,
    private productSvc: ProductService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
    this.discountSvc.getAllOffers().subscribe(o => { this.offers = o; this.cdr.markForCheck(); });
    this.categorySvc.getAll().subscribe(c => { this.categories = c; this.cdr.markForCheck(); });
    this.productSvc.getAll().subscribe(p => { this.products = p; this.cdr.markForCheck(); });
  }

  // ── Offer form ──────────────────────────────────────────────────────────

  openOfferForm(): void {
    this.editingOffer = null;
    this.offerForm = this.emptyOfferForm();
    this.showOfferForm = true;
  }

  editOffer(o: Offer): void {
    this.editingOffer = o;
    this.offerForm = {
      offerName: o.offerName, offerScope: o.offerScope,
      discountType: o.discountType, discountValue: o.discountValue,
      categoryName: o.categoryName, productId: o.productId,
      startDate: o.startDate, endDate: o.endDate, active: o.active
    };
    this.showOfferForm = true;
  }

  cancelOfferForm(): void { this.showOfferForm = false; this.editingOffer = null; }

  saveOffer(): void {
    if (!this.offerForm.offerName || !this.offerForm.discountValue) {
      this.toast.error('Offer name and discount value are required'); return;
    }
    this.savingOffer = true;
    const obs = this.editingOffer
      ? this.discountSvc.updateOffer(this.editingOffer.id, this.offerForm)
      : this.discountSvc.createOffer(this.offerForm);
    obs.subscribe({
      next: () => {
        this.savingOffer = false; this.showOfferForm = false;
        this.toast.success(this.editingOffer ? 'Offer updated' : 'Offer created!');
        this.loadAll(); this.cdr.markForCheck();
      },
      error: err => {
        this.savingOffer = false;
        this.toast.error(err.error?.message || 'Failed to save offer'); this.cdr.markForCheck();
      }
    });
  }

  toggleOffer(o: Offer): void {
    this.discountSvc.toggleOffer(o.id).subscribe({
      next: () => { this.toast.success(o.active ? 'Offer paused' : 'Offer activated'); this.loadAll(); },
      error: () => this.toast.error('Failed to update offer')
    });
  }

  deleteOffer(id: number): void {
    if (!confirm('Delete this offer?')) return;
    this.discountSvc.deleteOffer(id).subscribe({
      next: () => { this.toast.success('Offer deleted'); this.loadAll(); },
      error: () => this.toast.error('Failed to delete offer')
    });
  }

  // ── Product discount ────────────────────────────────────────────────────

  applyProductDiscount(): void {
    if (!this.pdProductId) return;
    this.discountSvc.applyProductDiscount({
      productIds: [this.pdProductId],
      discountType: this.pdType,
      discountValue: this.pdType === 'NONE' ? 0 : this.pdValue
    }).subscribe({
      next: () => { this.toast.success('Product discount applied'); this.productSvc.clearCache(); this.loadAll(); },
      error: () => this.toast.error('Failed')
    });
  }

  clearProductDiscount(productId: number): void {
    this.discountSvc.applyProductDiscount({ productIds: [productId], discountType: 'NONE', discountValue: 0 }).subscribe({
      next: () => { this.toast.success('Discount removed'); this.productSvc.clearCache(); this.loadAll(); },
      error: () => this.toast.error('Failed')
    });
  }

  // ── Category discount ───────────────────────────────────────────────────

  applyCategoryDiscount(): void {
    if (!this.cdCategory) return;
    this.discountSvc.applyCategoryDiscount({
      categoryName: this.cdCategory,
      discountType: this.cdType,
      discountValue: this.cdType === 'NONE' ? 0 : this.cdValue
    }).subscribe({
      next: () => { this.toast.success('Category discount applied'); this.productSvc.clearCache(); },
      error: () => this.toast.error('Failed')
    });
  }

  // ── Global offer ────────────────────────────────────────────────────────

  applyGlobal(): void {
    if (!this.globalName || !this.globalValue) return;
    const today = new Date().toISOString().slice(0, 10);
    this.discountSvc.createOffer({
      offerName: this.globalName, offerScope: 'GLOBAL',
      discountType: this.globalType, discountValue: this.globalValue,
      categoryName: null, productId: null,
      startDate: today, endDate: this.globalEnd, active: true
    }).subscribe({
      next: () => { this.toast.success('Global discount applied!'); this.globalName = ''; this.loadAll(); },
      error: () => this.toast.error('Failed to create offer')
    });
  }

  private emptyOfferForm(): OfferRequest {
    const today = new Date().toISOString().slice(0, 10);
    const end   = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    return {
      offerName: '', offerScope: 'GLOBAL', discountType: 'PERCENTAGE', discountValue: 10,
      categoryName: null, productId: null, startDate: today, endDate: end, active: true
    };
  }
}
