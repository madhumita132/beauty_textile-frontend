import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../services/product.service';
import { CategoryService } from '../../../services/category.service';
import { CartService } from '../../../services/cart.service';
import { ToastService } from '../../../services/toast.service';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { Category, Product } from '../../../models/models';

@Component({
  selector: 'app-product-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormsModule, NavbarComponent, DecimalPipe],
  template: `
    <app-navbar />
    <div class="container" style="padding-top:32px;padding-bottom:48px;">
      <div class="list-header">
        <h1 class="page-title">{{ selectedCategory || 'All Products' }}</h1>
        <div class="filters">
          <input [(ngModel)]="searchTerm" (ngModelChange)="onSearch()" placeholder="Search products..." class="form-control search-box" />
          <select [(ngModel)]="selectedCategory" (ngModelChange)="onCategoryChange()" class="form-control cat-select">
            <option value="">All Categories</option>
            @for (c of categories; track c.id) {
              <option [value]="c.name">{{ c.name }}</option>
            }
          </select>
        </div>
      </div>
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
                  <img [src]="p.imageUrl || 'assets/placeholder.jpg'" [alt]="p.name" loading="lazy" />
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
      }
    </div>
  `,
  styles: [`
    .page-title { font-size: 1.6rem; font-weight: 700; }
    .list-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
    .filters { display: flex; gap: 12px; flex-wrap: wrap; }
    .search-box { width: 240px; }
    .cat-select { width: 180px; }
    .empty-state { text-align: center; color: #7f8c8d; padding: 60px; font-size: 1.1rem; }
    .orig-price { color: #aaa; font-size: .8rem; margin-left: 4px; }
    .discount-label { background: #fdecea; color: #c62828; font-size: .7rem; font-weight: 700; padding: 1px 6px; border-radius: 6px; margin-left: 4px; }
    @media (max-width: 600px) { .list-header { flex-direction: column; } .search-box, .cat-select { width: 100%; } }
  `]
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  selectedCategory = '';
  searchTerm = '';
  loading = true;

  constructor(
    private prodSvc: ProductService,
    private catSvc: CategoryService,
    private cart: CartService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.catSvc.getAll().subscribe(c => { this.categories = c; this.cdr.markForCheck(); });
    this.route.queryParams.subscribe(params => {
      this.selectedCategory = params['category'] || '';
      this.load();
    });
  }

  load(): void {
    this.loading = true;
    this.prodSvc.getAll(this.selectedCategory || undefined, this.searchTerm || undefined)
      .subscribe(p => { this.products = p; this.loading = false; this.cdr.markForCheck(); });
  }

  onCategoryChange(): void { this.load(); }
  onSearch(): void { this.load(); }

  addToCart(p: Product): void {
    this.cart.addToCart(p);
    this.toast.success(`${p.name} added to cart`);
  }
}
