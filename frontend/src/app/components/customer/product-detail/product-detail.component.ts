import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { ProductService } from '../../../services/product.service';
import { CartService } from '../../../services/cart.service';
import { ToastService } from '../../../services/toast.service';
import { ReviewService } from '../../../services/review.service';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { Product, ProductVariant, ProductVariantSize, Review, ReviewSummary } from '../../../models/models';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NavbarComponent, DecimalPipe, FormsModule],
  template: `
    <app-navbar />
    <div class="container pd-page">

      @if (loading) {
        <div class="spinner-wrap"><div class="spinner"></div></div>

      } @else if (!product) {
        <p class="not-found">Product not found. <a routerLink="/products">← Back to shop</a></p>

      } @else {
        <a routerLink="/products" class="back-link">← Back to shop</a>
        <div class="detail-grid">

          <!-- ── Left: Image column ── -->
          <div class="img-col">
            <div class="img-main">
              <img [src]="displayImage" [alt]="product.name" />
            </div>
            <!-- thumbnail strip: product images + variant images -->
            @if (allThumbs.length > 1) {
              <div class="thumb-strip">
                @for (t of allThumbs; track t.url) {
                  <button class="thumb-btn" [class.active]="displayImage === t.url"
                    (click)="selectThumb(t)" [title]="t.label">
                    <img [src]="t.url" [alt]="t.label" />
                  </button>
                }
              </div>
            }
          </div>

          <!-- ── Right: Info column ── -->
          <div class="info-col">
            <span class="cat-badge">{{ product.category }}</span>
            <h1 class="prod-name">{{ product.name }}</h1>
            <div class="prod-price">
              ₹{{ (product.finalPrice ?? product.price) | number:'1.0-0' }}
              @if ((product.discountAmount || 0) > 0) {
                <s class="orig-price">₹{{ product.originalPrice | number:'1.0-0' }}</s>
                <span class="discount-label">{{ product.discountLabel }}</span>
              }
            </div>

            @if (product.description) {
              <p class="prod-desc">{{ product.description }}</p>
            }

            <!-- ── Colour picker ── -->
            @if (variants.length > 0) {
              <div class="option-block">
                <p class="option-label">
                  Colour:&nbsp;
                  <strong>{{ selectedVariant ? selectedVariant.colorName : 'Select a colour' }}</strong>
                </p>
                <div class="swatch-row">
                  @for (v of variants; track v.id) {
                    <button class="swatch"
                      [style.background-color]="v.colorHex || '#888'"
                      [class.active]="selectedVariant?.id === v.id"
                      [title]="v.colorName"
                      (click)="selectVariant(v)">
                    </button>
                  }
                </div>
              </div>

              <!-- ── Size picker (shown only when selected variant has sizes) ── -->
              @if (selectedVariant && selectedVariant.sizes.length > 0) {
                <div class="option-block">
                  <p class="option-label">
                    Size:&nbsp;
                    <strong>{{ selectedSize ? selectedSize.size : 'Select a size' }}</strong>
                  </p>
                  <div class="size-row">
                    @for (s of selectedVariant.sizes; track s.id) {
                      <button class="size-pill"
                        [class.active]="selectedSize?.id === s.id"
                        [class.oos]="s.stock === 0"
                        [disabled]="s.stock === 0"
                        (click)="selectSize(s)">
                        {{ s.size }}
                      </button>
                    }
                  </div>
                  @if (selectedSize) {
                    <p class="stock-hint" [class.low]="selectedSize.stock <= 5">
                      @if (selectedSize.stock > 5) { ✅ {{ selectedSize.stock }} in stock }
                      @else if (selectedSize.stock > 0) { ⚠️ Only {{ selectedSize.stock }} left! }
                      @else { ❌ Out of stock }
                    </p>
                  }
                </div>
              }

              <!-- Prompt: choose variant / size before adding -->
              @if (!canAddToCart()) {
                <p class="select-hint">
                  @if (!selectedVariant) { 👆 Please choose a colour }
                  @else if (selectedVariant.sizes.length > 0 && !selectedSize) { 👆 Please choose a size }
                </p>
              }

            } @else {
              <!-- No variants: show overall stock -->
              <div class="stock-line">
                @if (product.stock > 0) {
                  <span class="badge badge-success">In Stock ({{ product.stock }})</span>
                } @else {
                  <span class="badge badge-danger">Out of Stock</span>
                }
              </div>
            }

            <!-- ── Actions ── -->
            <div class="action-row">
              <button class="btn btn-primary" [disabled]="!canAddToCart()" (click)="addToCart()">
                🛒 Add to Cart
              </button>
              <a routerLink="/cart" class="btn btn-outline">View Cart</a>
            </div>
          </div><!-- /info-col -->

        </div><!-- /detail-grid -->

        <!-- ── Customer Reviews ── -->
        <div class="reviews-section">
          <div class="reviews-header">
            <div>
              <h2 class="reviews-title">Customer Reviews</h2>
              @if (reviewSummary && reviewSummary.totalReviews > 0) {
                <div class="rating-summary">
                  <span class="avg-rating">{{ reviewSummary.averageRating | number:'1.1-1' }}</span>
                  <div>
                    <div class="stars-big">{{ starsDisplay(reviewSummary.averageRating) }}</div>
                    <div class="review-count">Based on {{ reviewSummary.totalReviews }} reviews</div>
                  </div>
                </div>
              }
            </div>
            <button class="btn btn-outline btn-write" (click)="showReviewForm = !showReviewForm">
              ✏️ Write a Review
            </button>
          </div>

          @if (showReviewForm) {
            <div class="review-form-card">
              <h3>Share Your Experience</h3>
              <div class="star-picker">
                @for (s of [1,2,3,4,5]; track s) {
                  <button class="star-btn" [class.active]="reviewForm.rating >= s"
                    (click)="reviewForm.rating = s">★</button>
                }
                <span class="rating-label">{{ ratingLabel(reviewForm.rating) }}</span>
              </div>
              <div class="form-row-r">
                <input [(ngModel)]="reviewForm.customerName" class="form-ctrl"
                  placeholder="Your Name *" maxlength="100" />
                <input [(ngModel)]="reviewForm.mobileNumber" class="form-ctrl"
                  placeholder="Mobile Number (Optional)" maxlength="15" />
              </div>
              <textarea [(ngModel)]="reviewForm.reviewComment" rows="3" class="form-ctrl"
                placeholder="Tell us about your experience with this product..."></textarea>
              <div class="form-actions">
                <button class="btn btn-primary" [disabled]="!canSubmitReview() || submittingReview"
                  (click)="submitReview()">
                  {{ submittingReview ? 'Submitting...' : 'Submit Review' }}
                </button>
                <button class="btn btn-outline" (click)="showReviewForm = false">Cancel</button>
              </div>
              <p class="review-note">⏳ Reviews are published after admin approval.</p>
            </div>
          }

          <div class="star-filters">
            <span class="filter-lbl">Filter:</span>
            <button [class.active]="starFilter === 0" (click)="filterByStar(0)">All</button>
            @for (s of [5,4,3,2,1]; track s) {
              <button [class.active]="starFilter === s" (click)="filterByStar(s)">{{ s }}★</button>
            }
          </div>

          @if (reviews.length === 0) {
            <div class="no-reviews"><p>No reviews yet. Be the first to review this product!</p></div>
          } @else {
            <div class="review-cards">
              @for (r of reviews; track r.id) {
                <div class="review-item">
                  <div class="ri-header">
                    <div>
                      <span class="ri-name">{{ r.customerName }}</span>
                      <span class="ri-date"> &mdash; </span>
                    </div>
                    <div class="ri-stars">{{ starsDisplay(r.rating) }}</div>
                  </div>
                  @if (r.reviewComment) {
                    <div class="ri-comment">"​{{ r.reviewComment }}"</div>
                  }
                  @if (r.adminReply) {
                    <div class="ri-reply"><strong>Beauty Textile:</strong> {{ r.adminReply }}</div>
                  }
                </div>
              }
            </div>
          }
        </div><!-- /reviews-section -->

      }
    </div>
  `,

  styles: [`
    .pd-page { padding: 24px 16px 48px; }
    .back-link { color: var(--primary); text-decoration: none; font-size: .9rem; display:inline-block; margin-bottom:16px; }
    .back-link:hover { text-decoration: underline; }
    .spinner-wrap { display:flex; justify-content:center; padding:80px 0; }
    .not-found { text-align:center; padding:60px 0; color:#666; }

    /* Grid */
    .detail-grid { display:flex; gap:48px; flex-wrap:wrap; align-items:flex-start; }

    /* Image */
    .img-col { flex:0 0 380px; }
    .img-main { border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,.1);
                background:#f9f9f9; }
    .img-main img { width:100%; aspect-ratio:3/4; object-fit:cover; display:block;
                    transition: opacity .25s; }
    .thumb-strip { display:flex; gap:8px; margin-top:10px; flex-wrap:wrap; }
    .thumb-btn { width:64px; height:64px; border:2px solid #ddd; border-radius:8px;
                 overflow:hidden; cursor:pointer; padding:0; background:none;
                 transition: border-color .2s; }
    .thumb-btn.active { border-color: var(--primary); }
    .thumb-btn img { width:100%; height:100%; object-fit:cover; }

    /* Info */
    .info-col { flex:1; min-width:280px; }
    .cat-badge { background:var(--primary); color:#fff; font-size:.75rem; font-weight:600;
                 padding:3px 10px; border-radius:20px; letter-spacing:.5px; text-transform:uppercase; }
    .prod-name { font-size:1.75rem; font-weight:700; color:#2c1a00; margin:12px 0 6px; line-height:1.3; }
    .prod-price { font-size:2rem; font-weight:800; color:var(--primary); margin-bottom:14px; }
    .orig-price { color:#aaa; font-size:1.1rem; font-weight:400; margin-left:8px; }
    .discount-label { background:#fdecea; color:#c62828; font-size:.8rem; font-weight:700; padding:2px 8px; border-radius:8px; margin-left:8px; vertical-align:middle; }
    .prod-desc { color:#666; line-height:1.65; margin-bottom:20px; }

    /* Options */
    .option-block { margin-bottom:20px; }
    .option-label { font-size:.92rem; color:#555; margin-bottom:8px; }
    .option-label strong { color:#2c1a00; font-size:1rem; }

    /* Colour swatches */
    .swatch-row { display:flex; gap:10px; flex-wrap:wrap; }
    .swatch { width:36px; height:36px; border-radius:50%; border:3px solid transparent;
              cursor:pointer; outline:2px solid transparent; transition:all .2s; padding:0; }
    .swatch:hover { transform:scale(1.1); }
    .swatch.active { border-color:#fff; outline-color: var(--primary); box-shadow:0 0 0 2px var(--primary); }

    /* Size pills */
    .size-row { display:flex; gap:8px; flex-wrap:wrap; }
    .size-pill { min-width:52px; padding:8px 12px; border:2px solid #ccc; border-radius:8px;
                 font-weight:600; font-size:.9rem; cursor:pointer; background:#fff;
                 color:#444; transition:all .2s; }
    .size-pill:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
    .size-pill.active { background: var(--primary); border-color: var(--primary); color:#fff; }
    .size-pill.oos { text-decoration:line-through; color:#bbb; border-color:#eee; cursor:not-allowed; }

    .stock-hint { font-size:.85rem; margin-top:8px; color:#555; }
    .stock-hint.low { color:#e67e22; }
    .select-hint { font-size:.88rem; color:var(--primary); margin-bottom:8px; font-weight:500; }

    /* Stock badge (no-variant path) */
    .stock-line { margin-bottom:20px; }

    /* Actions */
    .action-row { display:flex; gap:12px; flex-wrap:wrap; margin-top:24px; }
    .btn { padding:12px 28px; border-radius:8px; font-size:1rem; font-weight:600; cursor:pointer; border:none; }
    .btn-primary { background:var(--primary); color:#fff; }
    .btn-primary:hover:not(:disabled) { background:var(--primary-d); }
    .btn-primary:disabled { opacity:.5; cursor:not-allowed; }
    .btn-outline { background:#fff; color:var(--primary); border:2px solid var(--primary); text-decoration:none; display:flex; align-items:center; }
    .btn-outline:hover { background:#fdf3e3; }

    @media (max-width: 700px) {
      .img-col { flex:none; width:100%; }
      .prod-name { font-size:1.4rem; }
      .prod-price { font-size:1.6rem; }
    }

    /* Reviews */
    .reviews-section { margin-top:48px; border-top:2px solid #f0e8e0; padding-top:32px; }
    .reviews-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; flex-wrap:wrap; gap:12px; }
    .reviews-title { font-size:1.3rem; font-weight:700; margin:0 0 8px; }
    .rating-summary { display:flex; align-items:center; gap:12px; }
    .avg-rating { font-size:2.5rem; font-weight:800; color:#805500; }
    .stars-big { font-size:1.3rem; color:#f39c12; }
    .review-count { font-size:.82rem; color:#888; margin-top:2px; }
    .btn-write { font-size:.85rem; padding:8px 16px; }

    .review-form-card { background:#fff9f0; border:1px solid #f5e6c8; border-radius:10px; padding:24px; margin-bottom:24px; }
    .review-form-card h3 { margin:0 0 16px; font-size:1rem; font-weight:700; }
    .star-picker { display:flex; align-items:center; gap:4px; margin-bottom:16px; }
    .star-btn { font-size:1.8rem; background:none; cursor:pointer; color:#ddd; padding:0 2px; line-height:1; transition:color .15s; }
    .star-btn.active { color:#f39c12; }
    .rating-label { font-size:.85rem; color:#805500; font-weight:600; margin-left:8px; }
    .form-row-r { display:flex; gap:12px; margin-bottom:12px; flex-wrap:wrap; }
    .form-ctrl { width:100%; padding:10px 12px; border:1px solid #ddd; border-radius:8px; font-size:.9rem; box-sizing:border-box; margin-bottom:12px; }
    .form-row-r .form-ctrl { flex:1; min-width:160px; margin-bottom:0; }
    textarea.form-ctrl { resize:vertical; }
    .form-actions { display:flex; gap:12px; margin-top:12px; flex-wrap:wrap; }
    .review-note { font-size:.78rem; color:#999; margin-top:8px; }

    .star-filters { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:20px; }
    .filter-lbl { font-size:.82rem; color:#888; }
    .star-filters button { padding:5px 14px; border-radius:20px; border:1px solid #ddd; background:#fff; font-size:.82rem; cursor:pointer; }
    .star-filters button.active { background:#805500; color:#fff; border-color:#805500; }

    .no-reviews { text-align:center; padding:32px; color:#bbb; }
    .review-cards { display:flex; flex-direction:column; gap:16px; }
    .review-item { background:#fff; border:1px solid #f0f0f0; border-radius:10px; padding:16px 20px; }
    .ri-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
    .ri-name { font-weight:700; font-size:.92rem; }
    .ri-date { font-size:.75rem; color:#aaa; }
    .ri-stars { color:#f39c12; font-size:1rem; }
    .ri-comment { font-style:italic; color:#555; margin:8px 0; line-height:1.5; }
    .ri-reply { background:#e8f4fd; padding:8px 12px; border-radius:6px; font-size:.82rem; margin-top:8px; }
  `]
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  variants: ProductVariant[] = [];
  selectedVariant: ProductVariant | null = null;
  selectedSize: ProductVariantSize | null = null;
  loading = true;
  _displayImage = '';
  // Reviews
  reviews: Review[] = [];
  reviewSummary: ReviewSummary | null = null;
  starFilter = 0;
  showReviewForm = false;
  submittingReview = false;
  reviewForm = { customerName: '', mobileNumber: '', rating: 0, reviewComment: '' };
  private productId = 0;

  /** All thumbnails: main image + extra images + variant images */
  get allThumbs(): { url: string; label: string; variantId?: number }[] {
    if (!this.product) return [];
    const thumbs: { url: string; label: string; variantId?: number }[] = [];
    const main = this.product.imageUrl || 'assets/placeholder.jpg';
    thumbs.push({ url: main, label: this.product.name });
    for (const url of (this.product.extraImages || [])) {
      if (url && url !== main) thumbs.push({ url, label: this.product.name });
    }
    for (const v of this.variants) {
      if (v.imageUrl && !thumbs.find(t => t.url === v.imageUrl)) {
        thumbs.push({ url: v.imageUrl, label: v.colorName, variantId: v.id });
      }
    }
    return thumbs;
  }

  get displayImage(): string {
    return this._displayImage
      || this.selectedVariant?.imageUrl
      || this.product?.imageUrl
      || 'assets/placeholder.jpg';
  }

  constructor(
    private route: ActivatedRoute,
    private prodSvc: ProductService,
    private cart: CartService,
    private toast: ToastService,
    private reviewSvc: ReviewService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.productId = id;

    // Load product first, then variants separately (variants failure won't block product display)
    this.prodSvc.getById(id).pipe(
      switchMap(product => {
        this.product = product;
        this.loading = false;
        this.cdr.markForCheck();             // show product immediately
        return this.prodSvc.getVariants(id).pipe(
          catchError(() => of([]))           // variants not available → empty array, no crash
        );
      }),
      catchError(() => {
        this.loading = false;
        this.cdr.markForCheck();
        return of([]);
      })
    ).subscribe(variants => {
      this.variants = variants as ProductVariant[];
      if (this.variants.length === 1) this.selectedVariant = this.variants[0];
      this.cdr.markForCheck();
    });

    // Load reviews & summary
    this.reviewSvc.getProductReviews(id).subscribe({
      next: r => { this.reviews = r; this.cdr.markForCheck(); },
      error: () => {}
    });
    this.reviewSvc.getProductSummary(id).subscribe({
      next: s => { this.reviewSummary = s; this.cdr.markForCheck(); },
      error: () => {}
    });
  }

  selectVariant(v: ProductVariant): void {
    this.selectedVariant = v;
    this.selectedSize = null;    // reset size on colour change
    if (v.imageUrl) this._displayImage = v.imageUrl;
    this.cdr.markForCheck();
  }

  selectThumb(t: { url: string; label: string; variantId?: number }): void {
    this._displayImage = t.url;
    if (t.variantId) {
      const v = this.variants.find(x => x.id === t.variantId);
      if (v) { this.selectedVariant = v; this.selectedSize = null; }
    }
    this.cdr.markForCheck();
  }

  selectSize(s: ProductVariantSize): void {
    this.selectedSize = s;
    this.cdr.markForCheck();
  }

  canAddToCart(): boolean {
    if (!this.product) return false;
    if (this.variants.length === 0) return this.product.stock > 0;
    if (!this.selectedVariant) return false;
    if (this.selectedVariant.sizes.length > 0) {
      if (!this.selectedSize) return false;
      if (this.selectedSize.stock === 0) return false;
    }
    return true;
  }

  addToCart(): void {
    if (!this.product || !this.canAddToCart()) return;
    this.cart.addToCart(this.product, this.selectedVariant?.colorName, this.selectedSize?.size);
    const label = [this.selectedVariant?.colorName, this.selectedSize?.size].filter(Boolean).join(' / ');
    this.toast.success(`${this.product.name}${label ? ' (' + label + ')' : ''} added to cart`);
  }

  // ── Reviews ──────────────────────────────────────────────────────────────

  filterByStar(star: number): void {
    this.starFilter = star;
    this.reviewSvc.getProductReviews(this.productId, star || undefined).subscribe({
      next: r => { this.reviews = r; this.cdr.markForCheck(); },
      error: () => {}
    });
  }

  canSubmitReview(): boolean {
    return this.reviewForm.rating > 0 && !!this.reviewForm.customerName.trim();
  }

  submitReview(): void {
    if (!this.canSubmitReview()) return;
    this.submittingReview = true;
    this.reviewSvc.submitReview({
      productId: this.productId,
      customerName: this.reviewForm.customerName.trim(),
      mobileNumber: this.reviewForm.mobileNumber || undefined,
      rating: this.reviewForm.rating,
      reviewComment: this.reviewForm.reviewComment
    }).subscribe({
      next: () => {
        this.submittingReview = false;
        this.showReviewForm = false;
        this.reviewForm = { customerName: '', mobileNumber: '', rating: 0, reviewComment: '' };
        this.cdr.markForCheck();
        this.toast.success('Thank you! Your review is pending approval.');
      },
      error: () => {
        this.submittingReview = false;
        this.cdr.markForCheck();
        this.toast.error('Failed to submit review. Please try again.');
      }
    });
  }

  starsDisplay(rating: number): string {
    const r = Math.round(rating);
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  }

  ratingLabel(r: number): string {
    return ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][r] ?? '';
  }
}
