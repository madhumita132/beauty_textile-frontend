import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DecimalPipe, NgIf, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../services/product.service';
import { CategoryService } from '../../../services/category.service';
import { ToastService } from '../../../services/toast.service';
import { Product, Category, ProductVariant } from '../../../models/models';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBarModule } from '@angular/material/snack-bar';

/** AI description templates per category */
function aiGenerateDescription(name: string, category: string): string {
  const n = name.trim();
  const templates: Record<string, string[]> = {
    'Sarees': [
      `Elegant ${n} crafted with finest quality fabric, perfect for special occasions and traditional celebrations. Features beautiful border work and vibrant colours.`,
      `Stunning ${n} with intricate weave patterns. Lightweight and comfortable to drape, ideal for festive and formal events.`,
    ],
    'Daily Wear Sarees': [
      `Comfortable and stylish ${n} designed for everyday wear. Breathable fabric that keeps you cool throughout the day.`,
    ],
    'Cotton Sarees': [
      `Pure cotton ${n} with beautiful hand-printed designs. Soft on skin and easy to maintain — perfect for daily wear.`,
    ],
    'Kanjivaram Sarees': [
      `Authentic Kanjivaram silk ${n} with traditional zari work. A timeless piece that exudes grace and elegance.`,
    ],
    'Pattu (Silk) Sarees': [
      `Premium quality Pattu silk ${n} with rich texture and lustrous sheen. Perfect for weddings and grand occasions.`,
    ],
    'Kurtis & Gowns': [
      `Trendy ${n} with modern design elements. Comfortable fit with premium fabric, suitable for casual and semi-formal occasions.`,
    ],
    'Kurti Tops': [
      `Stylish ${n} in soft breathable fabric. Versatile design that pairs well with palazzos, jeans or leggings.`,
    ],
    'Kurti Sets': [
      `Complete ${n} set with matching bottom. Elegant ethnic design for a coordinated festive look.`,
    ],
    'Gowns': [
      `Graceful ${n} with flowing silhouette. Premium fabric with beautiful embellishments, perfect for parties and functions.`,
    ],
    'Shirts': [
      `Smart casual ${n} with comfortable fit. Quality fabric that stays fresh all day — ideal for work and outings.`,
    ],
    'Pants & Trousers': [
      `Well-tailored ${n} with sturdy stitching and comfortable waist band. Versatile pair for both formal and casual settings.`,
    ],
    'Ethnic Wear': [
      `Traditional ${n} with intricate embroidery details. Festive-ready outfit that combines comfort with cultural elegance.`,
    ],
    'Kids': [
      `Adorable ${n} made with child-safe, soft fabric. Fun design that kids love, easy to wash and maintain.`,
    ],
    'Boys': [
      `Durable and stylish ${n} for active boys. Comfortable fit with quality fabric that withstands everyday play.`,
    ],
    'Girls': [
      `Cute and colourful ${n} designed for girls. Soft fabric with beautiful prints — perfect for school and outings.`,
    ],
  };

  const list = templates[category] || [
    `High quality ${n} from Beauty Textile. Premium fabric with excellent finish and comfortable fit for all occasions.`
  ];
  return list[Math.floor(Math.random() * list.length)];
}

@Component({
  selector: 'app-product-management',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, DecimalPipe, NgIf, SlicePipe,
    MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDialogModule, MatCardModule, MatChipsModule,
    MatTooltipModule, MatProgressSpinnerModule,
    MatDividerModule, MatBadgeModule, MatSnackBarModule
  ],
  template: `
    <!-- Page header -->
    <div class="pm-header">
      <div>
        <h1 class="page-title">Products</h1>
        <p class="page-sub">Manage your inventory</p>
      </div>
      <button mat-raised-button color="primary" (click)="openAdd()" class="add-btn">
        <mat-icon>add</mat-icon> Add Product
      </button>
    </div>

    <!-- Product form modal -->
    @if (showModal) {
      <div class="modal-overlay" (click)="closeModal()">
        <mat-card class="modal-card mat-elevation-z8" (click)="$event.stopPropagation()">
          <mat-card-header>
            <mat-icon mat-card-avatar style="color:#805500">{{ editing ? 'edit' : 'add_circle' }}</mat-icon>
            <mat-card-title>{{ editing ? 'Edit Product' : 'Add New Product' }}</mat-card-title>
            <mat-card-subtitle>{{ editing ? 'Update product details' : 'Fill in the product information' }}</mat-card-subtitle>
            <button mat-icon-button class="close-btn" (click)="closeModal()">
              <mat-icon>close</mat-icon>
            </button>
          </mat-card-header>

          <mat-card-content>
            <!-- Name + AI generate -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Product Name *</mat-label>
              <mat-icon matPrefix>label</mat-icon>
              <input matInput [(ngModel)]="form.name" placeholder="e.g. Kanjivaram Silk Saree" />
            </mat-form-field>

            <!-- Description with AI button -->
            <div class="desc-row">
              <mat-form-field appearance="outline" style="flex:1">
                <mat-label>Description</mat-label>
                <mat-icon matPrefix>description</mat-icon>
                <textarea matInput [(ngModel)]="form.description" rows="3"
                          placeholder="Product description..."></textarea>
              </mat-form-field>
              <button mat-stroked-button color="primary" type="button"
                      class="ai-btn" (click)="aiGenerate()"
                      [disabled]="!form.name?.trim()"
                      matTooltip="Auto-generate description using AI">
                <mat-icon>auto_awesome</mat-icon>
                AI Generate
              </button>
            </div>

            <!-- Category + Price row -->
            <div class="two-col">
              <mat-form-field appearance="outline" style="flex:1">
                <mat-label>Category *</mat-label>
                <mat-icon matPrefix>category</mat-icon>
                <mat-select [(ngModel)]="form.category">
                  @for (c of allCategories; track c.id) {
                    <mat-option [value]="c.name">{{ c.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" style="flex:1">
                <mat-label>Price (₹) *</mat-label>
                <mat-icon matPrefix>currency_rupee</mat-icon>
                <input matInput type="number" [(ngModel)]="form.price" min="0" />
              </mat-form-field>
            </div>

            <!-- Stock + Barcode row -->
            <div class="two-col">
              <mat-form-field appearance="outline" style="flex:1">
                <mat-label>Stock *</mat-label>
                <mat-icon matPrefix>inventory</mat-icon>
                <input matInput type="number" [(ngModel)]="form.stock" min="0" />
              </mat-form-field>

              <mat-form-field appearance="outline" style="flex:1">
                <mat-label>Barcode (auto if blank)</mat-label>
                <mat-icon matPrefix>qr_code</mat-icon>
                <input matInput [(ngModel)]="form.barcode" placeholder="BT1001" />
              </mat-form-field>
            </div>

            <!-- Image upload -->
            <div class="image-section">
              <div class="image-label">
                <mat-icon style="color:#805500">image</mat-icon>
                <span>Product Image</span>
              </div>

              @if (form.imageUrl) {
                <div class="image-preview">
                  <img [src]="form.imageUrl" alt="Product" />
                  <button mat-mini-fab color="warn" class="delete-img-btn"
                          (click)="deleteImage()" matTooltip="Remove image">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              }

              <label class="upload-area" [class.uploading]="uploadingImage">
                <input type="file" accept="image/*" (change)="onFileChange($event)" style="display:none" #fileInput />
                @if (uploadingImage) {
                  <mat-spinner diameter="32"></mat-spinner>
                  <span>Uploading...</span>
                } @else {
                  <mat-icon style="font-size:36px;width:36px;height:36px;color:#805500">cloud_upload</mat-icon>
                  <span>Click to upload image</span>
                  <small>JPG, PNG, WEBP (max 5MB)</small>
                }
                <input type="file" accept="image/*" (change)="onFileChange($event)" style="display:none" />
              </label>
            </div>

            <!-- Additional Images Gallery -->
            <div class="image-section mt-16">
              <div class="image-label">
                <mat-icon style="color:#805500">photo_library</mat-icon>
                <span>Additional Images (up to 5)</span>
              </div>
              <div class="extra-images-row">
                @for (img of (form.extraImages || []); track img; let i = $index) {
                  <div class="extra-img-thumb">
                    <img [src]="img" alt="Product image" />
                    <button mat-mini-fab color="warn" class="delete-img-btn"
                      (click)="removeExtraImage(i)" matTooltip="Remove">
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
                }
                @if ((form.extraImages || []).length < 5) {
                  <label class="extra-img-add" [class.uploading]="uploadingExtraImage">
                    <input type="file" accept="image/*" (change)="onExtraFileChange($event)" style="display:none" />
                    @if (uploadingExtraImage) { <mat-spinner diameter="24"></mat-spinner> }
                    @else {
                      <mat-icon style="font-size:28px;width:28px;height:28px;color:#805500">add_photo_alternate</mat-icon>
                    }
                  </label>
                }
              </div>
            </div>

            <!-- Color Variants (editing only) -->
            @if (editing) {
              <mat-divider style="margin:20px 0"></mat-divider>
              <div class="variants-section">
                <div class="variants-header">
                  <div class="image-label" style="margin:0">
                    <mat-icon style="color:#805500">palette</mat-icon>
                    <span>Color Variants</span>
                  </div>
                  @if (!showVariantForm) {
                    <button mat-stroked-button type="button" (click)="openVariantForm()"
                      style="border-color:#805500;color:#805500">
                      <mat-icon>add</mat-icon> Add Color
                    </button>
                  }
                </div>

                @if (loadingVariants) {
                  <div style="padding:8px 0"><mat-spinner diameter="24"></mat-spinner></div>
                } @else {
                  @for (v of variants; track v.id) {
                    <div class="variant-row">
                      <span class="color-swatch" [style.background]="v.colorHex || '#888'"></span>
                      <span class="variant-name">{{ v.colorName }}</span>
                      @if (v.imageUrl) {
                        <img class="variant-thumb" [src]="v.imageUrl" [alt]="v.colorName" />
                      }
                      <span class="text-muted text-sm" style="flex:1">
                        @if (isSareeCategory(form.category || '')) {
                          Stock: {{ variantTotalStock(v) }}
                        } @else {
                          Sizes: {{ v.sizes.length }}
                        }
                      </span>
                      <button mat-icon-button color="warn" (click)="deleteVariant(v.id)"
                        matTooltip="Remove">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  }
                  @if (variants.length === 0 && !showVariantForm) {
                    <p class="text-muted text-sm" style="padding:8px 0">No color variants yet.</p>
                  }
                }

                @if (showVariantForm) {
                  <div class="variant-form">
                    <div class="two-col" style="align-items:flex-end">
                      <mat-form-field appearance="outline" style="flex:1">
                        <mat-label>Color Name *</mat-label>
                        <input matInput [(ngModel)]="variantForm.colorName" placeholder="e.g. Navy Blue" />
                      </mat-form-field>
                      <div class="color-pick-group">
                        <label class="form-label" style="font-size:.78rem">Hex Color</label>
                        <input type="color" [(ngModel)]="variantForm.colorHex" class="color-input" />
                      </div>
                    </div>

                    <div class="form-group">
                      <label class="form-label">Variant Image (optional)</label>
                      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
                        @if (variantForm.imageUrl) {
                          <img [src]="variantForm.imageUrl"
                            style="width:60px;height:72px;object-fit:cover;border-radius:6px;border:2px solid #ddd" />
                          <button mat-icon-button color="warn" type="button"
                            (click)="variantForm.imageUrl = ''"><mat-icon>delete</mat-icon></button>
                        }
                        <label style="cursor:pointer">
                          <input type="file" accept="image/*"
                            (change)="onVariantImageChange($event)" style="display:none" />
                          @if (uploadingVariantImage) { <mat-spinner diameter="24"></mat-spinner> }
                          @else {
                            <button mat-stroked-button type="button">
                              <mat-icon>upload</mat-icon> Upload
                            </button>
                          }
                        </label>
                      </div>
                    </div>

                    @if (!isSareeCategory(form.category || '')) {
                      <div class="form-group">
                        <label class="form-label">Sizes &amp; Stock (pieces per size)</label>
                        <div class="sizes-table">
                          @for (s of variantForm.sizes; track s.size) {
                            <div class="size-row-admin">
                              <span class="size-label">{{ s.size }}</span>
                              <input type="number" [(ngModel)]="s.stock" min="0"
                                class="size-stock-input" placeholder="0" />
                              <span class="text-muted text-sm">pcs</span>
                            </div>
                          }
                        </div>
                      </div>
                    } @else {
                      <mat-form-field appearance="outline" style="width:180px">
                        <mat-label>Stock (pieces)</mat-label>
                        <mat-icon matPrefix>inventory</mat-icon>
                        <input matInput type="number" [(ngModel)]="variantForm.sareeStock" min="0" />
                      </mat-form-field>
                    }

                    <div style="display:flex;gap:8px;margin-top:8px">
                      <button mat-raised-button type="button" (click)="saveVariant()"
                        [disabled]="savingVariant"
                        style="background:#805500!important;color:white!important">
                        {{ savingVariant ? 'Saving...' : 'Save Color' }}
                      </button>
                      <button mat-stroked-button type="button"
                        (click)="showVariantForm = false">Cancel</button>
                    </div>
                  </div>
                }
              </div>
            }
          </mat-card-content>

          <mat-divider></mat-divider>
          <mat-card-actions align="end" style="padding:16px 24px;gap:12px;display:flex">
            <button mat-stroked-button (click)="closeModal()">Cancel</button>
            <button mat-raised-button color="primary" (click)="save()" [disabled]="saving" class="save-btn">
              @if (saving) { <mat-spinner diameter="18" style="display:inline-block;margin-right:6px;"></mat-spinner> }
              {{ saving ? 'Saving...' : (editing ? 'Update Product' : 'Add Product') }}
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    }

    <!-- Loading -->
    @if (loading) {
      <div style="display:flex;justify-content:center;padding:60px">
        <mat-spinner></mat-spinner>
      </div>
    } @else {
      <!-- Search + stats row -->
      <div class="controls-row">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search products</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [(ngModel)]="searchTerm" (ngModelChange)="onSearch()" placeholder="Name or barcode..." />
          @if (searchTerm) {
            <button matSuffix mat-icon-button (click)="searchTerm=''; onSearch()">
              <mat-icon>close</mat-icon>
            </button>
          }
        </mat-form-field>
        <div class="stat-chips">
          <span class="stat-chip total">Total: {{ products.length }}</span>
          <span class="stat-chip low" *ngIf="lowStockCount > 0">Low Stock: {{ lowStockCount }}</span>
        </div>
      </div>

      <!-- Products table -->
      <mat-card class="table-card mat-elevation-z2">
        <div class="table-wrap">
          <table mat-table [dataSource]="filtered" class="products-table">

            <!-- Image column -->
            <ng-container matColumnDef="image">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let p">
                <img [src]="p.imageUrl || 'assets/placeholder.jpg'"
                     class="product-thumb" alt="product" />
              </td>
            </ng-container>

            <!-- Barcode column -->
            <ng-container matColumnDef="barcode">
              <th mat-header-cell *matHeaderCellDef>Barcode</th>
              <td mat-cell *matCellDef="let p">
                <code class="barcode-chip">{{ p.barcode }}</code>
              </td>
            </ng-container>

            <!-- Name column -->
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Product</th>
              <td mat-cell *matCellDef="let p">
                <div class="prod-name">{{ p.name }}</div>
                <div class="prod-desc">{{ p.description | slice:0:60 }}{{ p.description?.length > 60 ? '…' : '' }}</div>
              </td>
            </ng-container>

            <!-- Category column -->
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>Category</th>
              <td mat-cell *matCellDef="let p">
                <span class="cat-badge">{{ p.category }}</span>
              </td>
            </ng-container>

            <!-- Price column -->
            <ng-container matColumnDef="price">
              <th mat-header-cell *matHeaderCellDef>Price</th>
              <td mat-cell *matCellDef="let p" class="price-cell">₹{{ p.price | number:'1.0-0' }}</td>
            </ng-container>

            <!-- Stock column -->
            <ng-container matColumnDef="stock">
              <th mat-header-cell *matHeaderCellDef>Stock</th>
              <td mat-cell *matCellDef="let p">
                <span [class]="'stock-badge ' + (p.stock < 5 ? 'low' : p.stock < 20 ? 'medium' : 'ok')">
                  {{ p.stock }}
                </span>
              </td>
            </ng-container>

            <!-- Actions column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let p">
                <button mat-icon-button color="primary" (click)="openEdit(p)" matTooltip="Edit">
                  <mat-icon>edit</mat-icon>
                </button>
                <a mat-icon-button [href]="barcodeUrl(p.id)" target="_blank" matTooltip="Barcode PNG">
                  <mat-icon>qr_code_2</mat-icon>
                </a>
                <button mat-icon-button color="warn" (click)="deleteProduct(p)" matTooltip="Delete">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="product-row"></tr>
          </table>

          @if (filtered.length === 0) {
            <div class="empty-state">
              <mat-icon>inventory_2</mat-icon>
              <p>No products found</p>
            </div>
          }
        </div>
      </mat-card>
    }
  `,
  styles: [`
    :host { display: block; }
    .pm-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-title { font-size: 1.6rem; font-weight: 700; color: #2c1a00; margin: 0; }
    .page-sub { font-size: .85rem; color: #8a7560; margin: 4px 0 0; }
    .add-btn { background: #805500 !important; color: white !important; height: 44px; }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
    .modal-card { width: 620px; max-width: 100%; max-height: 92vh; overflow-y: auto; position: relative; }
    .close-btn { position: absolute !important; right: 8px; top: 8px; }
    .full-width { width: 100%; }
    .two-col { display: flex; gap: 16px; }
    @media (max-width: 500px) { .two-col { flex-direction: column; } }
    .desc-row { display: flex; gap: 12px; align-items: flex-start; }
    .ai-btn { min-width: 130px; margin-top: 4px; border-color: #805500 !important; color: #805500 !important; white-space: nowrap; }
    .ai-btn mat-icon { font-size: 18px; margin-right: 4px; }

    /* Image upload */
    .image-section { border: 1px dashed #c9b090; border-radius: 12px; padding: 16px; margin-top: 4px; }
    .image-label { display: flex; align-items: center; gap: 6px; font-weight: 600; color: #2c1a00; margin-bottom: 12px; font-size: .9rem; }
    .image-preview { position: relative; display: inline-block; margin-bottom: 12px; }
    .image-preview img { width: 100px; height: 120px; object-fit: cover; border-radius: 8px; border: 2px solid #e0c898; }
    .delete-img-btn { position: absolute !important; top: -10px; right: -10px; width: 28px !important; height: 28px !important; line-height: 28px !important; }
    .delete-img-btn mat-icon { font-size: 16px !important; }
    .upload-area {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      border: 2px dashed #c9b090; border-radius: 8px; padding: 20px; cursor: pointer;
      gap: 4px; transition: background .2s; color: #8a7560;
    }
    .upload-area:hover { background: #fdf3e0; }
    .upload-area.uploading { opacity: .7; cursor: wait; }
    .upload-area small { font-size: .75rem; }
    .save-btn { background: #805500 !important; color: white !important; }

    /* Controls */
    .controls-row { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .search-field { min-width: 280px; }
    .stat-chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .stat-chip { padding: 4px 12px; border-radius: 20px; font-size: .8rem; font-weight: 600; }
    .stat-chip.total { background: #e8d5b0; color: #3e2000; }
    .stat-chip.low { background: #fdecea; color: #c62828; }

    /* Table */
    .table-card { overflow: hidden; }
    .table-wrap { overflow-x: auto; }
    .products-table { width: 100%; }
    .product-thumb { width: 52px; height: 64px; object-fit: cover; border-radius: 6px; display: block; }
    .barcode-chip { font-size: .78rem; background: #f3e8d0; color: #3e2000; padding: 2px 8px; border-radius: 12px; font-family: monospace; }
    .prod-name { font-weight: 600; font-size: .88rem; color: #2c1a00; }
    .prod-desc { font-size: .75rem; color: #8a7560; }
    .cat-badge { background: #f3e8d0; color: #805500; padding: 3px 10px; border-radius: 20px; font-size: .75rem; font-weight: 600; }
    .price-cell { font-weight: 700; color: #805500; }
    .stock-badge { padding: 3px 10px; border-radius: 20px; font-size: .8rem; font-weight: 700; }
    .stock-badge.ok { background: #d5f5e3; color: #1a7a3c; }
    .stock-badge.medium { background: #fff3cd; color: #856404; }
    .stock-badge.low { background: #fdecea; color: #c62828; }
    .product-row:hover { background: #fdf9f5; }
    .empty-state { padding: 60px; text-align: center; color: #8a7560; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 8px; opacity: .4; }
    /* Extra images */
    .extra-images-row { display:flex; gap:8px; flex-wrap:wrap; margin-top:8px; }
    .extra-img-thumb { position:relative; width:80px; height:96px; flex-shrink:0; }
    .extra-img-thumb img { width:100%; height:100%; object-fit:cover; border-radius:6px; border:2px solid #e0c898; }
    .extra-img-add { width:80px; height:96px; border:2px dashed #c9b090; border-radius:8px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background .2s; }
    .extra-img-add:hover { background:#fdf3e0; }
    /* Variants */
    .variants-section { }
    .variants-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
    .variant-row { display:flex; align-items:center; gap:10px; padding:8px 12px; background:#fdf9f5; border-radius:8px; margin-bottom:6px; border:1px solid #ede4d4; }
    .color-swatch { width:22px; height:22px; border-radius:50%; border:2px solid rgba(0,0,0,.12); flex-shrink:0; }
    .variant-name { font-weight:600; font-size:.88rem; min-width:80px; }
    .variant-thumb { width:38px; height:46px; object-fit:cover; border-radius:4px; }
    .variant-form { background:#fdf9f5; border-radius:12px; padding:16px; border:1px solid #e0c898; margin-top:8px; }
    .color-pick-group { display:flex; flex-direction:column; gap:4px; padding-bottom:22px; }
    .color-input { width:52px; height:36px; border:1px solid #ddd; border-radius:6px; cursor:pointer; padding:2px; }
    .sizes-table { display:flex; flex-direction:column; gap:6px; }
    .size-row-admin { display:flex; align-items:center; gap:12px; }
    .size-label { width:44px; font-weight:700; font-size:.9rem; color:#2c1a00; }
    .size-stock-input { width:80px; padding:6px 10px; border:1px solid #ddd; border-radius:6px; font-size:.9rem; font-family:inherit; text-align:center; }
    .size-stock-input:focus { outline:none; border-color:#805500; }
  `]
})
export class ProductManagementComponent implements OnInit {
  products: Product[] = [];
  filtered: Product[] = [];
  allCategories: Category[] = [];
  loading = true;
  showModal = false;
  editing: Product | null = null;
  saving = false;
  uploadingImage = false;
  searchTerm = '';
  uploadingExtraImage = false;
  variants: ProductVariant[] = [];
  loadingVariants = false;
  showVariantForm = false;
  savingVariant = false;
  uploadingVariantImage = false;
  variantForm = {
    colorName: '',
    colorHex: '#888888',
    imageUrl: '',
    sareeStock: 0,
    sizes: [] as { size: string; stock: number }[]
  };

  displayedColumns = ['image', 'barcode', 'name', 'category', 'price', 'stock', 'actions'];

  form: Partial<Product> & { description?: string } = {};

  get lowStockCount(): number { return this.products.filter(p => p.stock < 5).length; }

  constructor(
    private prodSvc: ProductService,
    private catSvc: CategoryService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
    this.catSvc.getAll().subscribe(c => { this.allCategories = c; this.cdr.markForCheck(); });
  }

  load(): void {
    this.loading = true;
    this.prodSvc.getAll().subscribe(p => {
      this.products = p;
      this.filtered = p;
      this.loading = false;
      this.cdr.markForCheck();
    });
  }

  onSearch(): void {
    const q = this.searchTerm.toLowerCase();
    this.filtered = q ? this.products.filter(p =>
      p.name.toLowerCase().includes(q) || p.barcode.toLowerCase().includes(q)) : this.products;
  }

  openAdd(): void {
    this.editing = null;
    this.form = { stock: 0, price: 0, category: this.allCategories[0]?.name || '', extraImages: [] };
    this.showModal = true;
  }

  openEdit(p: Product): void {
    this.editing = p;
    this.form = { ...p, extraImages: [...(p.extraImages || [])] };
    this.showModal = true;
    this.showVariantForm = false;
    this.variants = [];
    this.loadVariants(p.id);
  }

  closeModal(): void { this.showModal = false; this.showVariantForm = false; this.variants = []; }

  /** AI-generate description from product name + category */
  aiGenerate(): void {
    const desc = aiGenerateDescription(this.form.name || '', this.form.category || '');
    this.form.description = desc;
    this.toast.success('Description generated!');
  }

  onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { this.toast.error('Image must be under 5 MB'); return; }
    this.uploadingImage = true;
    this.prodSvc.uploadImage(file).subscribe({
      next: res => { this.form.imageUrl = res.imageUrl; this.uploadingImage = false; this.toast.success('Image uploaded'); this.cdr.markForCheck(); },
      error: () => { this.uploadingImage = false; this.toast.error('Image upload failed'); this.cdr.markForCheck(); }
    });
  }

  deleteImage(): void {
    this.form.imageUrl = '';
    this.toast.success('Image removed');
  }

  save(): void {
    if (!this.form.name?.trim() || !this.form.category) { this.toast.error('Name and category are required'); return; }
    this.saving = true;
    const obs = this.editing
      ? this.prodSvc.update(this.editing.id, this.form as Product)
      : this.prodSvc.create(this.form as Product);

    obs.subscribe({
      next: () => { this.toast.success('Product saved successfully'); this.closeModal(); this.load(); this.saving = false; this.cdr.markForCheck(); },
      error: err => { this.toast.error(err.error?.message || 'Save failed'); this.saving = false; this.cdr.markForCheck(); }
    });
  }

  deleteProduct(p: Product): void {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    this.prodSvc.delete(p.id).subscribe({
      next: () => { this.toast.success('Product deleted'); this.load(); },
      error: () => { this.toast.error('Delete failed'); this.cdr.markForCheck(); }
    });
  }

  barcodeUrl(id: number): string { return this.prodSvc.barcodeImageUrl(id); }

  // ── Extra Images ──────────────────────────────────────────────────────
  onExtraFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { this.toast.error('Image must be under 5 MB'); return; }
    this.uploadingExtraImage = true;
    this.prodSvc.uploadImage(file).subscribe({
      next: res => {
        if (!this.form.extraImages) this.form.extraImages = [];
        this.form.extraImages.push(res.imageUrl);
        this.uploadingExtraImage = false;
        this.cdr.markForCheck();
      },
      error: () => { this.uploadingExtraImage = false; this.toast.error('Upload failed'); this.cdr.markForCheck(); }
    });
  }

  removeExtraImage(index: number): void {
    this.form.extraImages?.splice(index, 1);
    this.cdr.markForCheck();
  }

  // ── Color Variants ────────────────────────────────────────────────────
  private readonly SAREE_CATS = new Set(['Sarees', 'Daily Wear', 'Party Wear Saree', 'Cotton Saree', 'KanjiPattu Saree', 'Pattu Saree']);
  private readonly KIDS_CATS  = new Set(['Boys Collection', 'Girls Collection']);

  isSareeCategory(cat: string): boolean {
    return this.SAREE_CATS.has(cat) || cat.toLowerCase().includes('saree');
  }

  private sizesFor(cat: string): string[] {
    if (this.isSareeCategory(cat)) return [];
    if (this.KIDS_CATS.has(cat)) return ['2Y', '4Y', '6Y', '8Y', '10Y', '12Y'];
    return ['S', 'M', 'L', 'XL', 'XXL'];
  }

  variantTotalStock(v: ProductVariant): number {
    return v.sizes.reduce((s, x) => s + x.stock, 0);
  }

  loadVariants(productId: number): void {
    this.loadingVariants = true;
    this.prodSvc.getVariants(productId).subscribe({
      next: v => { this.variants = v; this.loadingVariants = false; this.cdr.markForCheck(); },
      error: () => { this.loadingVariants = false; this.cdr.markForCheck(); }
    });
  }

  openVariantForm(): void {
    const sizes = this.sizesFor(this.form.category || '');
    this.variantForm = {
      colorName: '',
      colorHex: '#888888',
      imageUrl: '',
      sareeStock: 0,
      sizes: sizes.map(s => ({ size: s, stock: 0 }))
    };
    this.showVariantForm = true;
  }

  saveVariant(): void {
    if (!this.variantForm.colorName.trim()) { this.toast.error('Color name is required'); return; }
    if (!this.editing) return;
    this.savingVariant = true;
    const isSaree = this.isSareeCategory(this.form.category || '');
    const sizes = isSaree
      ? [{ size: 'ONE SIZE', stock: this.variantForm.sareeStock }]
      : this.variantForm.sizes;
    this.prodSvc.addVariant(this.editing.id, {
      colorName: this.variantForm.colorName,
      colorHex: this.variantForm.colorHex,
      imageUrl: this.variantForm.imageUrl || null,
      sizes
    } as any).subscribe({
      next: () => {
        this.savingVariant = false;
        this.showVariantForm = false;
        this.loadVariants(this.editing!.id);
        this.toast.success('Color variant added');
        this.cdr.markForCheck();
      },
      error: err => {
        this.savingVariant = false;
        this.toast.error(err.error?.message || 'Failed to add color');
        this.cdr.markForCheck();
      }
    });
  }

  deleteVariant(variantId: number): void {
    if (!this.editing) return;
    this.prodSvc.deleteVariant(this.editing.id, variantId).subscribe({
      next: () => { this.loadVariants(this.editing!.id); this.toast.success('Color removed'); },
      error: () => this.toast.error('Delete failed')
    });
  }

  onVariantImageChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { this.toast.error('Image must be under 5 MB'); return; }
    this.uploadingVariantImage = true;
    this.prodSvc.uploadImage(file).subscribe({
      next: res => { this.variantForm.imageUrl = res.imageUrl; this.uploadingVariantImage = false; this.cdr.markForCheck(); },
      error: () => { this.uploadingVariantImage = false; this.toast.error('Upload failed'); this.cdr.markForCheck(); }
    });
  }
}
