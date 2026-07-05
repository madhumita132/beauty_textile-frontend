import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CategoryService } from '../../../services/category.service';
import { ProductService } from '../../../services/product.service';
import { ReviewService } from '../../../services/review.service';
import { CartService } from '../../../services/cart.service';
import { ToastService } from '../../../services/toast.service';
import { HeroSlideService } from '../../../services/hero-slide.service';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { Category, HeroSlide, Product, Review } from '../../../models/models';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NavbarComponent, DecimalPipe, MatIconModule],
  template: `
    <app-navbar />

    <!-- Hero -->
    <section class="hero">
      <div class="hero-bg-swiper">
        @for (slide of heroSlides; track slide.id) {
          <div class="hero-slide" [style.background-image]="'linear-gradient(120deg, rgba(17,12,6,.68), rgba(17,12,6,.18)), url(' + (slide.imagePath || 'images/categories/saree/saree.svg') + ')'">
            <div class="hero-content">
              <div class="hero-kicker">{{ slide.kicker }}</div>
              <h1>{{ slide.title }}</h1>
              <p>{{ slide.text }}</p>
              <div class="hero-actions">
                <a routerLink="/products" class="btn btn-primary btn-lg">Shop Now</a>
              </div>
            </div>
          </div>
        }
      </div>
    </section>

    <section class="section offers-section bg-white">
      <div class="container">
        <h2 class="section-title">Special Offers</h2>
        <div class="offer-grid">
          @for (offer of offers; track offer.title) {
            <div class="offer-card">
              <div class="offer-badge">{{ offer.badge }}</div>
              <h3>{{ offer.title }}</h3>
              <p>{{ offer.text }}</p>
            </div>
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

    <!-- Categories -->
    <section class="section">
      <div class="container">
        <h2 class="section-title">Collections by Category</h2>
        <div class="main-cat-grid">
          @for (group of categoryGroups; track group.name) {
            <div class="main-cat-card">
              <div class="main-cat-head">
                @if (group.imagePath) {
                  <img class="cat-image" [src]="group.imagePath" [alt]="group.name" />
                } @else {
                  <div class="cat-icon">{{ catIcon(group.name) }}</div>
                }
                <div>
                  <div class="main-cat-name">{{ group.name }}</div>
                  <div class="main-cat-meta">{{ (group.children?.length || 0) }} subcategories</div>
                </div>
              </div>

              <div class="sub-chip-wrap">
                @for (sub of group.children; track sub.id) {
                  <a
                    [routerLink]="['/products']"
                    [queryParams]="{group: group.name, category: sub.name}"
                    class="sub-chip">
                    {{ sub.name }}
                  </a>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </section>

    <section class="section quotes-strip">
      <div class="container">
        <div class="quote-grid">
          @for (q of quotes; track q) {
            <div class="quote-card">"{{ q }}"</div>
          }
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

    <!-- Trust badges -->
    <section class="section trust-strip">
      <div class="container trust-grid">
        @for (badge of trustBadges; track badge.label) {
          <div class="trust-item">
            <mat-icon class="trust-icon">{{ badge.icon }}</mat-icon>
            <span class="trust-label">{{ badge.label }}</span>
          </div>
        }
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer-top">
          <div class="footer-col brand-col">
            <p class="footer-brand">BEAUTY TEXTILE</p>
            <p><strong>Phone:</strong> +91 8344515186</p>
            <p><strong>Email:</strong> beautytextile.shop@gmail.com</p>
            <p><strong>Shop Address:</strong> Nadar Sivan Kovil Stop, Aruppukottai-626101</p>
          </div>

          <div class="footer-col">
            <p class="footer-title">More Items</p>
            <a [routerLink]="['/products']" [queryParams]="{ group: 'Men' }">Mens Collection</a>
            <a [routerLink]="['/products']" [queryParams]="{ group: 'Women' }">Womens Collection</a>
            <a [routerLink]="['/products']" [queryParams]="{ group: 'Kids' }">Kids Collection</a>
            <a [routerLink]="['/products']" [queryParams]="{ category: 'Sarees' }">Sarees</a>
            <a [routerLink]="['/products']" [queryParams]="{ category: 'Kurthi' }">Kurthi</a>
            <a [routerLink]="['/products']" [queryParams]="{ category: 'Shirts' }">Shirts</a>
          </div>

          <div class="footer-col">
            <p class="footer-title">Important Links</p>
            <a routerLink="/about-us">About Us</a>
            <a routerLink="/contact-us">Contact Us</a>
            <a routerLink="/policy/privacy">Privacy Policy</a>
            <a href="https://www.bluedart.com/tracking" target="_blank">Track Your Order</a>
            <a routerLink="/policy/shipping">Shipping Policy</a>
            <a routerLink="/policy/refund">Refund Policy</a>
            <a routerLink="/policy/terms">Terms of Service</a>
          </div>

          <div class="footer-col">
            <p class="footer-title">FAQ & Policies</p>
            <p class="footer-note">For returns, exchange, and delivery support, contact us on Instagram or phone. We will guide you quickly.</p>
            <div class="social-row">
              <a class="social-link" [href]="instagramLink" target="_blank">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <defs>
                    <linearGradient id="igGradFooter" x1="0" y1="24" x2="24" y2="0">
                      <stop offset="0" stop-color="#f9ce34"/>
                      <stop offset=".5" stop-color="#ee2a7b"/>
                      <stop offset="1" stop-color="#6228d7"/>
                    </linearGradient>
                  </defs>
                  <rect x="0" y="0" width="24" height="24" rx="6" fill="url(#igGradFooter)"/>
                  <path fill="#fff" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.012-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Instagram
              </a>
              <a class="social-link" [href]="whatsappLink" target="_blank">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <circle cx="12" cy="12" r="11" fill="#25D366"/>
                  <path fill="#fff" d="M12 5.5a6.5 6.5 0 00-5.6 9.8L5.5 18.5l3.3-.9a6.5 6.5 0 100-12.1zm3.9 9.3c-.2.5-1 1-1.4 1-.4 0-.8.1-2.6-.6-2.2-.9-3.6-3.1-3.7-3.2-.1-.2-.9-1.2-.9-2.2 0-1 .5-1.5.7-1.7.2-.2.4-.2.6-.2h.4c.1 0 .3 0 .5.4l.6 1.5c.1.2.1.3 0 .5l-.3.4c-.1.1-.2.2-.1.4.2.4.7 1.1 1.5 1.7.9.7 1.6.9 1.8 1 .2.1.3.1.4-.1l.5-.6c.2-.2.3-.2.5-.1l1.4.7c.2.1.3.1.3.3 0 .2 0 .6-.2 1.1z"/>
                </svg>
                WhatsApp
              </a>
            </div>
            </div>
        </div>
        <p class="text-muted text-sm mt-8">© 2008 Beauty Textile. All rights reserved.</p>
      </div>
    </footer>
  `,
  styles: [`
    .hero { padding: 0; color: #fff; }
    .hero-bg-swiper { position: relative; min-height: 560px; overflow: hidden; }
    .hero-slide {
      min-height: 560px;
      display: grid;
      align-items: center;
      background-size: cover;
      background-position: center;
      animation: heroSwap 18s infinite;
    }
    .hero-slide:nth-child(1) { animation-delay: 0s; }
    .hero-slide:nth-child(2) { animation-delay: 6s; }
    .hero-slide:nth-child(3) { animation-delay: 12s; }
    @keyframes heroSwap {
      0%, 30% { opacity: 1; transform: translateX(0); }
      33%, 100% { opacity: 0; transform: translateX(-10px); position: absolute; inset: 0; }
    }
    .hero-content { max-width: 640px; padding: 84px 24px 84px; margin-left: 8%; }
    .hero-kicker {
      display: inline-block;
      background: rgba(255,255,255,.16);
      border: 1px solid rgba(255,255,255,.22);
      backdrop-filter: blur(4px);
      padding: 7px 12px;
      border-radius: 999px;
      margin-bottom: 14px;
      font-size: .85rem;
      letter-spacing: .4px;
    }
    .hero h1 { font-size: 3rem; font-weight: 800; line-height: 1.08; max-width: 11ch; }
    .hero p { margin: 18px 0 24px; font-size: 1.08rem; opacity: .95; max-width: 56ch; }
    .hero-actions { display:flex; gap: 12px; flex-wrap: wrap; }
    .btn-lg { padding: 14px 32px; font-size: 1rem; }
    .section { padding: 56px 0; }
    .section-title { font-size: 1.6rem; font-weight: 700; margin-bottom: 32px; text-align: center; }
    .section-title::after { content: ''; display: block; width: 60px; height: 3px; background: #c0392b; margin: 8px auto 0; }
    .bg-white { background: #fff; }
    .quotes-strip { background: #fff9f1; }
    .quote-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
    .quote-card { background:#fff; border:1px solid #f1dfc8; border-radius:16px; padding:18px; font-style:italic; color:#5f4520; box-shadow:0 6px 20px rgba(128,85,0,.08); }
    .offers-section { background: linear-gradient(180deg, #fff, #fff8ed); }
    .offer-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
    .offer-card { background: linear-gradient(145deg, #805500, #a36a11); color:#fff; border-radius:18px; padding:22px; box-shadow:0 12px 28px rgba(128,85,0,.16); }
    .offer-badge { display:inline-block; background: rgba(255,255,255,.18); padding:6px 10px; border-radius:999px; font-size:.78rem; margin-bottom:10px; }
    .offer-card h3 { margin:0 0 8px; font-size:1.05rem; }
    .offer-card p { margin:0; opacity:.95; line-height:1.55; }
    .main-cat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 18px; }
    .main-cat-card {
      background: linear-gradient(145deg, #ffffff, #fff9f2);
      border: 1px solid #f2e6d5;
      border-radius: 18px;
      padding: 18px;
      box-shadow: 0 6px 22px rgba(128,85,0,.08);
    }
    .main-cat-head { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .cat-image {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      object-fit: cover;
      border: 1px solid #f1dfc8;
      background: #fff;
      flex-shrink: 0;
    }
    .cat-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: grid;
      place-items: center;
      font-size: 1.5rem;
      background: #fef0dd;
    }
    .main-cat-name { font-weight: 700; font-size: 1.05rem; color: #2f2a1f; }
    .main-cat-meta { color: #8a7a60; font-size: .82rem; }
    .sub-chip-wrap { display: flex; flex-wrap: wrap; gap: 8px; }
    .sub-chip {
      display: inline-flex;
      align-items: center;
      padding: 7px 12px;
      border-radius: 999px;
      background: #f7efe5;
      color: #5f4520;
      border: 1px solid #e8d8c0;
      font-size: .84rem;
      font-weight: 600;
      text-decoration: none;
      transition: .2s;
    }
    .sub-chip:hover { background: #805500; color: #fff; border-color: #805500; }
    .footer { background: linear-gradient(180deg, #2c1a00, #1a0f00); color: #ecd9b8; padding: 48px 24px 28px; text-align: left; }
    .footer-top { display:grid; grid-template-columns: 1.3fr 1fr 1fr .9fr; gap:32px; align-items:flex-start; }
    .footer-col { display:flex; flex-direction:column; gap:10px; }
    .footer-brand { font-weight:800; font-size:1rem; letter-spacing:3px; margin-bottom:8px; color:#ffb347; }
    .footer-title { margin:0 0 8px; font-size:1rem; letter-spacing:2px; color:#ffb347; text-transform:uppercase; }
    .footer-col a { color:#ecd9b8; text-decoration:none; line-height:1.5; }
    .footer-col a:hover { color:#ffb347; text-decoration:underline; }
    .social-row { display:flex; gap:14px; flex-wrap:wrap; }
    .social-link { display:inline-flex; align-items:center; gap:8px; font-weight:700; color:#ffb347; }
    .footer-note { line-height:1.7; color:#c9a876; }
    @media (max-width: 980px) {
      .footer-top { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 640px) {
      .footer-top { grid-template-columns: 1fr; }
    }
    .orig-price { color: #aaa; font-size: .8rem; margin-left: 4px; }
    .discount-label { background: #fdecea; color: #c62828; font-size: .7rem; font-weight: 700; padding: 1px 6px; border-radius: 6px; margin-left: 4px; }
    .testimonials-section { background: #fef9f0; }
    .testimonials-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
    .testimonial-card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 10px rgba(0,0,0,.06); border-top: 3px solid #f5c842; }
    .t-stars { font-size: 1.2rem; color: #f39c12; margin-bottom: 10px; }
    .t-comment { font-style: italic; color: #555; line-height: 1.6; margin-bottom: 12px; font-size: .92rem; }
    .t-author { font-weight: 700; color: #805500; font-size: .88rem; }

    .trust-strip { background: #fff; padding: 40px 0; border-top: 1px solid #f0e6d2; border-bottom: 1px solid #f0e6d2; }
    .trust-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
      text-align: center;
    }
    .trust-item { display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .trust-icon { font-size: 30px !important; width: 30px; height: 30px; color: #805500; }
    .trust-label { font-size: .82rem; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #3a2a10; }
    @media (max-width: 720px) { .trust-grid { grid-template-columns: repeat(2, 1fr); row-gap: 32px; } }
  `]
})
export class HomeComponent implements OnInit {
  categories: Category[] = [];
  categoryGroups: Category[] = [];
  products: Product[] = [];
  testimonials: Review[] = [];
  loading = true;
  whatsappLink = 'https://wa.me/918344515186?text=Hello%20Beauty%20Textile';
  instagramLink = 'https://www.instagram.com/_beauty_sarees_?igsh=dm9neGJkOHllaTR0';

  readonly trustBadges = [
    { icon: 'local_shipping',      label: 'Free Delivery' },
    { icon: 'verified',            label: 'Guaranteed Quality' },
    { icon: 'assignment_return',   label: 'Easy Returns' },
    { icon: 'shield',              label: 'Secure Payments' }
  ];

  /** Fallback slides shown only if the admin-managed slides haven't loaded yet or the API is unavailable. */
  private readonly fallbackHeroSlides: HeroSlide[] = [
    {
      id: -1,
      kicker: 'New Collection',
      title: 'Elegant ethnic wear for every celebration',
      text: 'Discover handpicked sarees, festive sets, and trendy styles designed to feel premium and look refined.',
      imagePath: 'images/categories/saree/saree.svg',
      sortOrder: 0
    },
    {
      id: -2,
      kicker: 'Worldwide Shipping',
      title: 'Styles that travel beautifully',
      text: 'From daily wear to festive statements, explore fashion-forward pieces that ship anywhere your customers are.',
      imagePath: 'images/categories/kurthi/kurthi.svg',
      sortOrder: 1
    },
    {
      id: -3,
      kicker: 'Freshly Launched',
      title: 'Collections for Women, Men & Kids',
      text: 'Browse elegant categories, stunning subcategories, and season-ready looks with a premium boutique feel.',
      imagePath: 'images/categories/mens/mens.svg',
      sortOrder: 2
    }
  ];

  heroSlides: HeroSlide[] = this.fallbackHeroSlides;
  quotes = [
    'Dressing well is a form of good manners.',
    'Tradition, tailored with modern elegance.',
    'Celebrate every moment with a style that lasts.'
  ];
  offers = [
    { badge: 'Offer', title: 'Festive discounts', text: 'Seasonal deals on selected sarees and ethnic wear.' },
    { badge: 'New', title: 'Fresh launches', text: 'Newly launched collections updated regularly.' },
    { badge: 'Support', title: 'Easy WhatsApp help', text: 'Quick product assistance and order support.' }
  ];

  private icons: Record<string, string> = {
    Sarees: '🥻', Women: '👗', Men: '👔', Kids: '🧒', Girls: '👧', Boys: '👦', Kurthi: '🥻'
  };

  constructor(
    private catSvc: CategoryService,
    private prodSvc: ProductService,
    private reviewSvc: ReviewService,
    private cart: CartService,
    private toast: ToastService,
    private heroSlideSvc: HeroSlideService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.catSvc.getActiveTree().subscribe(c => {
      this.categories = c;
      this.categoryGroups = c.filter(x => ['Sarees', 'Women', 'Men', 'Kids'].includes(x.name));
      this.cdr.markForCheck();
    });
    this.prodSvc.getAll().subscribe(p => {
      this.products = p.slice(0, 8);
      this.loading = false;
      this.cdr.markForCheck();
    });
    this.reviewSvc.getTestimonials(6).subscribe({
      next: t => { this.testimonials = t; this.cdr.markForCheck(); },
      error: () => {}
    });
    this.heroSlideSvc.getAll().subscribe({
      next: slides => {
        if (slides.length > 0) { this.heroSlides = slides; this.cdr.markForCheck(); }
      },
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
