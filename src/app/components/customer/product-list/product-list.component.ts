import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { combineLatest } from 'rxjs';
import { ProductService } from '../../../services/product.service';
import { CategoryService } from '../../../services/category.service';
import { CartService } from '../../../services/cart.service';
import { ToastService } from '../../../services/toast.service';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { Category, Product } from '../../../models/models';
import { ImageUrlPipe } from '../../../shared/image-url.pipe';

@Component({
  selector: 'app-product-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormsModule, NavbarComponent, DecimalPipe, ImageUrlPipe],
  template: `
    <app-navbar />
    <div class="container" style="padding-top:32px;padding-bottom:48px;">
      <div class="list-header">
        <h1 class="page-title">{{ selectedSubcategory || selectedGroup || 'All Products' }}</h1>
        <div class="filters">
          <input [(ngModel)]="searchTerm" (ngModelChange)="onSearch()" placeholder="Search products..." class="form-control search-box" />
        </div>
      </div>

      <div class="group-tabs">
        <button class="group-tab" [class.active]="selectedGroup === ''" (click)="onGroupChange('')">All</button>
        @for (g of topGroups; track g.id) {
          <button class="group-tab" [class.active]="selectedGroup === g.name" (click)="onGroupChange(g.name)">
            {{ g.name }}
          </button>
        }
      </div>

      @if (selectedGroup && activeSubcategories.length > 0) {
        <div class="sub-filter-wrap">
          <button class="sub-chip" [class.active]="selectedSubcategory === ''" (click)="onSubcategoryChange('')">All {{ selectedGroup }}</button>
          @for (s of activeSubcategories; track s.id) {
            <button class="sub-chip" [class.active]="selectedSubcategory === s.name" (click)="onSubcategoryChange(s.name)">
              {{ s.name }}
            </button>
          }
        </div>
      }
      @if (loading) {
        <div class="spinner"></div>
      } @else if (products.length === 0) {
        <div class="empty-state">No products found.</div>
      } @else {
        <div class="product-grid">
          @for (p of products; track p.id) {
            <div class="card product-card">
              <a [routerLink]="['/products', p.id]">
                <div class="product-img">
                  <img [src]="(p.imageUrl | imageUrl) || 'assets/placeholder.jpg'" [alt]="p.name" loading="lazy" />
                </div>
                <div class="product-info">
                  <div class="product-category">{{ p.category }}</div>
                  <div class="product-name">{{ p.name }}</div>
                  <div class="product-price">
                    ₹{{ (p.finalPrice ?? p.price) | number:'1.0-0' }}
                    @if ((p.discountAmount || 0) > 0) {
                      <s class="orig-price">₹{{ p.originalPrice | number:'1.0-0' }}</s>
                      <span class="discount-label">{{ p.discountLabel }}</span>
                    }
                  </div>
                </div>
              </a>
              <div class="product-actions">
                @if (p.stock > 0) {
                  <button class="btn btn-primary btn-sm btn-block" (click)="addToCart(p)">Add to Cart</button>
                } @else {
                  <span class="badge badge-danger">Out of Stock</span>
                }
              </div>
            </div>
          }
        </div>

        @if (totalPages > 1) {
          <div class="page-nav" aria-label="Product pagination">
            <button class="page-btn nav" [disabled]="currentPage === 0" (click)="loadPage(currentPage - 1)">
              <span aria-hidden="true">‹</span>
              <span>Previous</span>
            </button>

            <div class="page-numbers" role="group" aria-label="Pages">
              @if (pageWindow[0] > 1) {
                <button class="page-btn" (click)="loadPage(0)">1</button>
                @if (pageWindow[0] > 2) {
                  <span class="dots">…</span>
                }
              }

              @for (p of pageWindow; track p) {
                <button class="page-btn"
                        [class.active]="p === currentPage + 1"
                        [attr.aria-current]="p === currentPage + 1 ? 'page' : null"
                        (click)="loadPage(p - 1)">
                  {{ p }}
                </button>
              }

              @if (pageWindow[pageWindow.length - 1] < totalPages) {
                @if (pageWindow[pageWindow.length - 1] < totalPages - 1) {
                  <span class="dots">…</span>
                }
                <button class="page-btn" (click)="loadPage(totalPages - 1)">{{ totalPages }}</button>
              }
            </div>

            <button class="page-btn nav" [disabled]="currentPage >= totalPages - 1" (click)="loadPage(currentPage + 1)">
              <span>Next</span>
              <span aria-hidden="true">›</span>
            </button>
          </div>

          <div class="page-label">
            Showing page {{ currentPage + 1 }} of {{ totalPages }} ({{ pageSize }} products per page)
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page-title { font-size: 1.6rem; font-weight: 700; }
    .list-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
    .filters { display: flex; gap: 12px; flex-wrap: wrap; }
    .search-box { width: 240px; }
    .group-tabs { display: flex; flex-wrap: wrap; gap: 10px; margin: 0 0 12px; }
    .group-tab {
      border: 1px solid #d9c8ad;
      background: #fff7ec;
      color: #6a4b1f;
      border-radius: 999px;
      padding: 8px 14px;
      font-weight: 600;
      cursor: pointer;
      transition: .2s;
    }
    .group-tab.active { background: #805500; color: #fff; border-color: #805500; }
    .sub-filter-wrap { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
    .sub-chip {
      border: 1px solid #e3d3b0;
      background: #fff;
      color: #6a4b1f;
      border-radius: 999px;
      padding: 6px 12px;
      font-size: .85rem;
      font-weight: 600;
      cursor: pointer;
      transition: .2s;
    }
    .sub-chip:hover { background: #fff3dc; border-color: #c9a35f; }
    .sub-chip.active { background: #805500; color: #fff; border-color: #805500; }
    .empty-state { text-align: center; color: #7f8c8d; padding: 60px; font-size: 1.1rem; }
    .page-nav {
      margin-top: 22px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
    }
    .page-numbers { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: center; }
    .page-btn {
      border: 1px solid #d9c8ad;
      background: #fff;
      color: #6a4b1f;
      border-radius: 10px;
      min-width: 38px;
      height: 38px;
      padding: 0 12px;
      font-weight: 700;
      font-size: .86rem;
      cursor: pointer;
      transition: .2s ease;
    }
    .page-btn:hover:not(:disabled) {
      border-color: #b88b42;
      background: #fff3dc;
      transform: translateY(-1px);
    }
    .page-btn:disabled {
      opacity: .45;
      cursor: not-allowed;
      transform: none;
    }
    .page-btn.active {
      background: #805500;
      color: #fff;
      border-color: #805500;
      box-shadow: 0 6px 16px rgba(128, 85, 0, .24);
    }
    .page-btn.nav {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-width: auto;
      padding: 0 12px;
    }
    .dots { color: #9b8a72; font-weight: 700; letter-spacing: 2px; }
    .page-label {
      margin-top: 10px;
      text-align: center;
      color: #6f6353;
      font-size: .86rem;
      font-weight: 600;
    }
    .orig-price { color: #aaa; font-size: .8rem; margin-left: 4px; }
    .discount-label { background: #fdecea; color: #c62828; font-size: .7rem; font-weight: 700; padding: 1px 6px; border-radius: 6px; margin-left: 4px; }
    @media (max-width: 600px) { .list-header { flex-direction: column; } .search-box { width: 100%; } }
  `]
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  topGroups: Category[] = [];
  selectedGroup = '';
  selectedSubcategory = '';
  searchTerm = '';
  loading = true;
  currentPage = 0;
  pageSize = 50;
  totalPages = 1;

  get pageWindow(): number[] {
    if (this.totalPages <= 1) return [1];
    const current = this.currentPage + 1;
    const start = Math.max(1, current - 2);
    const end = Math.min(this.totalPages, start + 4);
    const adjustedStart = Math.max(1, end - 4);
    const pages: number[] = [];
    for (let p = adjustedStart; p <= end; p++) pages.push(p);
    return pages;
  }

  get activeSubcategories(): Category[] {
    if (!this.selectedGroup) return [];
    const g = this.topGroups.find(x => x.name === this.selectedGroup);
    return g?.children || [];
  }

  constructor(
    private prodSvc: ProductService,
    private catSvc: CategoryService,
    private cart: CartService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  /** Default subcategory to auto-select when a group is chosen without an explicit subcategory. */
  private readonly defaultSubcategoryMap: Record<string, string> = {
    Kids: 'Girls Collection'
  };

  private getDefaultSubcategory(group: string): string {
    if (!group) return '';
    const mapped = this.defaultSubcategoryMap[group];
    if (mapped) return mapped;
    const g = this.topGroups.find(x => x.name === group);
    return g?.children?.[0]?.name || '';
  }

  ngOnInit(): void {
    combineLatest([this.catSvc.getActiveTree(), this.route.queryParams]).subscribe(([c, params]) => {
      this.categories = c;
      this.topGroups = c.filter(x => ['Sarees', 'Women', 'Men', 'Kids'].includes(x.name));
      this.selectedGroup = params['group'] || '';
      const explicitCategory = params['category'] || '';
      this.selectedSubcategory = explicitCategory || this.getDefaultSubcategory(this.selectedGroup);
      this.loadPage(0);
      this.cdr.markForCheck();
    });
  }

  loadPage(page: number): void {
    this.loading = true;
    this.currentPage = Math.max(0, page);
    this.prodSvc.getPaged(this.currentPage, this.pageSize, this.selectedSubcategory || undefined, this.searchTerm || undefined)
      .subscribe(r => {
        this.products = r.content;
        this.totalPages = Math.max(1, r.totalPages || 1);
        this.currentPage = Math.min(this.currentPage, this.totalPages - 1);
        this.loading = false;
        this.cdr.markForCheck();
      });
  }

  onGroupChange(group: string): void {
    this.selectedGroup = group;
    this.selectedSubcategory = this.getDefaultSubcategory(group);
    this.loadPage(0);
  }

  onSubcategoryChange(subcategory: string): void {
    this.selectedSubcategory = subcategory;
    this.loadPage(0);
  }

  onSearch(): void { this.loadPage(0); }

  addToCart(p: Product): void {
    this.cart.addToCart(p);
    this.toast.success(`${p.name} added to cart`);
  }
}
