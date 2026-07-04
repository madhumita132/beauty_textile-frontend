import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CategoryService } from '../../../services/category.service';
import { ProductService } from '../../../services/product.service';
import { ReviewService } from '../../../services/review.service';
import { CartService } from '../../../services/cart.service';
import { ToastService } from '../../../services/toast.service';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { Category, Product, Review } from '../../../models/models';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NavbarComponent, DecimalPipe],
  template: `
    <app-navbar />

    <!-- Hero -->
    <section class="hero">
      <div class="hero-content">
        <h1>Welcome to Beauty Textile</h1>
        <p>Discover the finest collection of ethnic wear, casual wear &amp; more</p>
        <a routerLink="/products" class="btn btn-primary btn-lg">Shop Now →</a>
      </div>
    </section>

    <!-- Categories -->
    <section class="section">
      <div class="container">
        <h2 class="section-title">Shop by Category</h2>
        <div class="cat-grid">
          @for (cat of categories; track cat.id) {
            <a [routerLink]="['/products']" [queryParams]="{category: cat.name}" class="cat-card">
              <div class="cat-icon">{{ catIcon(cat.name) }}</div>
              <div class="cat-name">{{ cat.name }}</div>
            </a>
          }
        </div>
      </div>
    </section>

    <!-- New Arrivals -->
    <section class="section bg-white">
      <div class="container">
        <h2 class="section-title">New Arrivals</h2>
        @if (loading) {
          <div class="spinner"></div>
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
                  <button class="btn btn-primary btn-sm btn-block" (click)="addToCart(p)">Add to Cart</button>
                </div>
              </div>
            }
          </div>
        }
        <div class="text-center mt-32">
          <a routerLink="/products" class="btn btn-outline">View All Products →</a>
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    @if (testimonials.length > 0) {
      <section class="section testimonials-section">
        <div class="container">
          <h2 class="section-title">What Our Customers Say</h2>
          <div class="testimonials-grid">
            @for (t of testimonials; track t.id) {
              <div class="testimonial-card">
                <div class="t-stars">{{ starsDisplay(t.rating) }}</div>
                @if (t.reviewComment) {
                  <div class="t-comment">"{{ t.reviewComment }}"</div>
                }
                <div class="t-author">— {{ t.customerName }}</div>
              </div>
            }
          </div>
        </div>
      </section>
    }

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <p><strong>Beauty Textile</strong> — beautytextile.shop@gmail.com | 8344515186</p>
        <p class="text-muted text-sm mt-8">© 2025 Beauty Textile. All rights reserved.</p>
      </div>
    </footer>
  `,
  styles: [`
    .hero { background: linear-gradient(135deg, #efe7e6 0%, #eae2e1 100%); color: #310202; padding: 80px 24px; text-align: center; }
    .hero h1 { font-size: 2.5rem; font-weight: 700; } .hero h1 span { color: #ffd700; }
    .hero p { margin: 16px 0 32px; font-size: 1.1rem; opacity: .9; }
    .btn-lg { padding: 14px 32px; font-size: 1rem; }
    .section { padding: 56px 0; }
    .section-title { font-size: 1.6rem; font-weight: 700; margin-bottom: 32px; text-align: center; }
    .section-title::after { content: ''; display: block; width: 60px; height: 3px; background: #c0392b; margin: 8px auto 0; }
    .bg-white { background: #fff; }
    .cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 16px; }
    .cat-card { background: #fff; border-radius: 12px; padding: 24px 12px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,.07); transition: .2s; }
    .cat-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(192,57,43,.15); }
    .cat-icon { font-size: 2rem; margin-bottom: 8px; }
    .cat-name { font-weight: 600; font-size: .9rem; color: #2c3e50; }
    .footer { background:  #805500; color: #ecf0f1; padding: 32px 24px; text-align: center; }
    .orig-price { color: #aaa; font-size: .8rem; margin-left: 4px; }
    .discount-label { background: #fdecea; color: #c62828; font-size: .7rem; font-weight: 700; padding: 1px 6px; border-radius: 6px; margin-left: 4px; }
    .testimonials-section { background: #fef9f0; }
    .testimonials-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
    .testimonial-card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 10px rgba(0,0,0,.06); border-top: 3px solid #f5c842; }
    .t-stars { font-size: 1.2rem; color: #f39c12; margin-bottom: 10px; }
    .t-comment { font-style: italic; color: #555; line-height: 1.6; margin-bottom: 12px; font-size: .92rem; }
    .t-author { font-weight: 700; color: #805500; font-size: .88rem; }
  `]
})
export class HomeComponent implements OnInit {
  categories: Category[] = [];
  products: Product[] = [];
  testimonials: Review[] = [];
  loading = true;

  private icons: Record<string, string> = {
    Women: '👗', Men: '👔', Kids: '🧒', Girls: '👧', Boys: '👦', Kurthi: '🥻'
  };

  constructor(
    private catSvc: CategoryService,
    private prodSvc: ProductService,
    private reviewSvc: ReviewService,
    private cart: CartService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.catSvc.getAll().subscribe(c => { this.categories = c; this.cdr.markForCheck(); });
    this.prodSvc.getAll().subscribe(p => {
      this.products = p.slice(0, 8);
      this.loading = false;
      this.cdr.markForCheck();
    });
    this.reviewSvc.getTestimonials(6).subscribe({
      next: t => { this.testimonials = t; this.cdr.markForCheck(); },
      error: () => {}
    });
  }

  catIcon(name: string): string {
    return this.icons[name] || '🏷️';
  }

  addToCart(p: Product): void {
    this.cart.addToCart(p);
    this.toast.success(`${p.name} added to cart`);
  }

  starsDisplay(rating: number): string {
    const r = Math.round(rating);
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  }
}
