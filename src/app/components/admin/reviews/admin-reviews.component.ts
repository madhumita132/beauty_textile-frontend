import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ReviewService } from '../../../services/review.service';
import { ToastService } from '../../../services/toast.service';
import { Review, ReviewStats } from '../../../models/models';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

type AdminTab = 'all' | 'pending' | 'approved' | 'stats';

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePipe, DecimalPipe, MatIconModule, MatButtonModule],
  template: `
    <h1 class="page-title">Customer Reviews</h1>

    <!-- Stats bar -->
    @if (stats) {
      <div class="stats-row">
        <div class="stat-box">
          <mat-icon class="stat-icon">rate_review</mat-icon>
          <div>
            <div class="stat-val">{{ stats.totalReviews }}</div>
            <div class="stat-lbl">Total Reviews</div>
          </div>
        </div>
        <div class="stat-box warn">
          <mat-icon class="stat-icon">hourglass_top</mat-icon>
          <div>
            <div class="stat-val">{{ stats.pendingReviews }}</div>
            <div class="stat-lbl">Pending Approval</div>
          </div>
        </div>
        <div class="stat-box good">
          <mat-icon class="stat-icon">star</mat-icon>
          <div>
            <div class="stat-val">{{ stats.averageRating | number:'1.1-1' }} ★</div>
            <div class="stat-lbl">Avg Rating</div>
          </div>
        </div>
      </div>
    }

    <!-- Tabs -->
    <div class="tabs">
      <button [class.active]="tab==='all'"      (click)="tab='all';      applyFilter()">
        <mat-icon>list</mat-icon> All
      </button>
      <button [class.active]="tab==='pending'"  (click)="tab='pending';  applyFilter()">
        <mat-icon>hourglass_top</mat-icon> Pending
        @if (pendingCount > 0) { <span class="badge">{{ pendingCount }}</span> }
      </button>
      <button [class.active]="tab==='approved'" (click)="tab='approved'; applyFilter()">
        <mat-icon>verified</mat-icon> Approved
      </button>
      <button [class.active]="tab==='stats'"    (click)="tab='stats'">
        <mat-icon>leaderboard</mat-icon> Top Rated
      </button>
    </div>

    <!-- Top Rated tab -->
    @if (tab === 'stats') {
      <div class="section-card">
        <h2>Top Rated Products</h2>
        @if (topRated.length === 0) {
          <p class="empty">No rating data yet.</p>
        } @else {
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr><th>Product ID</th><th>Avg Rating</th><th>Reviews</th></tr>
              </thead>
              <tbody>
                @for (r of topRated; track r.productId) {
                  <tr>
                    <td>#{{ r.productId }}</td>
                    <td><span class="stars">{{ starsDisplay(r.averageRating) }}</span> {{ r.averageRating | number:'1.1-1' }}</td>
                    <td>{{ r.reviewCount }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    }

    <!-- Review list tabs -->
    @if (tab !== 'stats') {
      @if (filtered.length === 0) {
        <div class="empty-state">
          <mat-icon>rate_review</mat-icon>
          <p>No reviews in this category.</p>
        </div>
      } @else {
        <div class="reviews-list">
          @for (r of pagedFiltered; track r.id) {
            <div class="review-card" [class.pending]="r.status==='PENDING'" [class.rejected]="r.status==='REJECTED'">
              <div class="review-header">
                <div class="reviewer-avatar">{{ initials(r.customerName) }}</div>
                <div class="review-meta">
                  <span class="reviewer-name">{{ r.customerName }}</span>
                  @if (r.mobileNumber) {
                    <span class="reviewer-phone">{{ r.mobileNumber }}</span>
                  }
                  <span class="review-date">{{ r.createdAt | date:'dd MMM yyyy' }}</span>
                </div>
                <div class="review-right">
                  <div class="star-display">{{ starsDisplay(r.rating) }} ({{ r.rating }}/5)</div>
                  <span class="status-chip status-{{ r.status.toLowerCase() }}">
                    <mat-icon>{{ statusIcon(r.status) }}</mat-icon>
                    {{ r.status }}
                  </span>
                </div>
              </div>

              @if (r.reviewComment) {
                <div class="review-body">"{{ r.reviewComment }}"</div>
              }

              @if (r.adminReply) {
                <div class="admin-reply">
                  <mat-icon>reply</mat-icon>
                  <span><strong>Admin Reply:</strong> {{ r.adminReply }}</span>
                </div>
              }

              <!-- Action row -->
              <div class="review-actions">
                @if (r.status === 'PENDING') {
                  <button class="btn btn-success btn-sm" (click)="approve(r)">
                    <mat-icon>check_circle</mat-icon> Approve
                  </button>
                  <button class="btn btn-danger btn-sm" (click)="reject(r)">
                    <mat-icon>cancel</mat-icon> Reject
                  </button>
                }
                @if (r.status === 'APPROVED') {
                  <button class="btn btn-danger btn-sm" (click)="reject(r)">
                    <mat-icon>cancel</mat-icon> Reject
                  </button>
                }
                @if (r.status === 'REJECTED') {
                  <button class="btn btn-success btn-sm" (click)="approve(r)">
                    <mat-icon>check_circle</mat-icon> Re-approve
                  </button>
                }

                <!-- Reply toggle -->
                <button class="btn btn-outline btn-sm" (click)="toggleReply(r)">
                  <mat-icon>{{ replyTargetId === r.id ? 'close' : 'reply' }}</mat-icon>
                  {{ replyTargetId === r.id ? 'Cancel' : 'Reply' }}
                </button>

                <button class="btn btn-danger-outline btn-sm" (click)="deleteReview(r)">
                  <mat-icon>delete</mat-icon> Delete
                </button>
              </div>

              <!-- Reply input -->
              @if (replyTargetId === r.id) {
                <div class="reply-form">
                  <textarea [(ngModel)]="replyText" rows="2" class="reply-input"
                    placeholder="Type your reply here..."></textarea>
                  <button class="btn btn-primary btn-sm" [disabled]="!replyText.trim()" (click)="submitReply(r)">
                    <mat-icon>send</mat-icon> Send Reply
                  </button>
                </div>
              }
            </div>
          }
        </div>

        @if (totalPages > 1) {
          <div class="review-pagination">
            <button class="btn btn-outline btn-sm" [disabled]="page === 0" (click)="goToPage(0)">First</button>
            <button class="btn btn-outline btn-sm" [disabled]="page === 0" (click)="goToPage(page - 1)">Prev</button>
            <span class="page-label">Page {{ page + 1 }} of {{ totalPages }}</span>
            <button class="btn btn-outline btn-sm" [disabled]="page >= totalPages - 1" (click)="goToPage(page + 1)">Next</button>
            <button class="btn btn-outline btn-sm" [disabled]="page >= totalPages - 1" (click)="goToPage(totalPages - 1)">Last</button>
          </div>
        }
      }
    }
  `,
  styles: [`
    .page-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 16px; color: #2c1a00; }
    .stats-row { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .stat-box {
      background: #fff; border-radius: 12px; padding: 16px 24px; box-shadow: 0 2px 10px rgba(128,85,0,.08);
      min-width: 160px; display: flex; align-items: center; gap: 14px; border-top: 3px solid #805500;
      transition: transform .15s, box-shadow .15s;
    }
    .stat-box:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(128,85,0,.14); }
    .stat-box .stat-icon { font-size: 30px; width: 30px; height: 30px; color: #805500; }
    .stat-box.warn { border-top-color: #e67e22; }
    .stat-box.warn .stat-icon { color: #e67e22; }
    .stat-box.good { border-top-color: #27ae60; }
    .stat-box.good .stat-icon { color: #27ae60; }
    .stat-val { font-size: 1.6rem; font-weight: 700; }
    .stat-lbl { font-size: .78rem; color: #888; margin-top: 2px; }

    .tabs { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
    .tabs button {
      padding: 8px 18px; border-radius: 22px; font-size: .85rem; font-weight: 600; border: 2px solid #e5ded1;
      background: #fff; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: .15s;
    }
    .tabs button mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .tabs button:hover { border-color: #805500; }
    .tabs button.active { background: linear-gradient(135deg, #805500, #a06800); color: #fff; border-color: #805500; box-shadow: 0 3px 10px rgba(128,85,0,.3); }
    .badge { background: #c0392b; color: #fff; border-radius: 10px; padding: 0 6px; font-size: .72rem; }

    .section-card { background: #fff; border-radius: 10px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,.06); }
    .section-card h2 { font-size: 1rem; font-weight: 700; margin-bottom: 16px; }
    .table-wrap { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: .88rem; }
    .data-table th { background: #f8f5f0; padding: 10px 14px; text-align: left; font-weight: 600; }
    .data-table td { padding: 10px 14px; border-bottom: 1px solid #f0f0f0; }
    .stars { font-size: 1rem; }
    .empty { color: #aaa; text-align: center; padding: 24px 0; }

    .empty-state { text-align: center; padding: 60px 24px; color: #bbb; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 12px; }

    .reviews-list { display: flex; flex-direction: column; gap: 16px; }
    .review-card {
      background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,.06);
      border-left: 4px solid #27ae60; transition: box-shadow .15s;
    }
    .review-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,.1); }
    .review-card.pending { border-left-color: #e67e22; }
    .review-card.rejected { border-left-color: #e74c3c; opacity: .7; }

    .review-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; gap: 12px; }
    .reviewer-avatar {
      flex-shrink: 0; width: 40px; height: 40px; border-radius: 50%;
      background: linear-gradient(135deg, #805500, #a06800); color: #fff;
      display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: .85rem;
    }
    .review-meta { display: flex; flex-direction: column; gap: 2px; flex: 1; }
    .reviewer-name { font-weight: 700; font-size: .95rem; }
    .reviewer-phone { font-size: .78rem; color: #888; }
    .review-date { font-size: .75rem; color: #aaa; }
    .review-right { text-align: right; flex-shrink: 0; }
    .star-display { font-weight: 700; font-size: .9rem; color: #f39c12; }
    .status-chip {
      display: inline-flex; align-items: center; gap: 4px; font-size: .72rem; font-weight: 700;
      padding: 3px 10px 3px 6px; border-radius: 10px; margin-top: 4px; text-transform: uppercase;
    }
    .status-chip mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .status-pending  { background: #fff3cd; color: #856404; }
    .status-approved { background: #d4edda; color: #155724; }
    .status-rejected { background: #f8d7da; color: #721c24; }

    .review-body { font-style: italic; color: #444; margin-bottom: 12px; background: #fafafa; padding: 10px; border-radius: 6px; }
    .admin-reply { display: flex; align-items: flex-start; gap: 8px; background: #e8f4fd; padding: 10px; border-radius: 6px; margin-bottom: 12px; font-size: .85rem; }
    .admin-reply mat-icon { font-size: 16px; color: #2980b9; }

    .review-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .btn-sm { padding: 6px 14px; font-size: .8rem; display: inline-flex; align-items: center; gap: 4px; min-width: 92px; justify-content: center; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,.08); }
    .btn-sm mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .btn-sm:hover { transform: translateY(-1px); }
    .btn-success { background: #27ae60; color: #fff; border-radius: 6px; }
    .btn-danger  { background: #e74c3c; color: #fff; border-radius: 6px; }
    .btn-danger-outline { background: none; color: #e74c3c; border: 1px solid #e74c3c; border-radius: 6px; box-shadow: none; }
    .review-pagination { margin-top: 14px; display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; align-items: center; }
    .page-label { font-size: .85rem; color: #666; min-width: 120px; text-align: center; }

    .reply-form { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
    .reply-input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: .85rem; resize: vertical; }
  `]
})
export class AdminReviewsComponent implements OnInit {
  tab: AdminTab = 'pending';
  reviews: Review[] = [];
  filtered: Review[] = [];
  stats: ReviewStats | null = null;
  topRated: any[] = [];
  replyTargetId: number | null = null;
  replyText = '';
  page = 0;
  pageSize = 10;

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }

  get pagedFiltered(): Review[] {
    const start = this.page * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  get pendingCount(): number { return this.reviews.filter(r => r.status === 'PENDING').length; }

  constructor(
    private svc: ReviewService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAll();
    this.loadStats();
    this.loadTopRated();
  }

  private loadAll(): void {
    this.svc.getAllReviews().subscribe({
      next: r => {
        this.reviews = r;
        this.applyFilter();
        this.cdr.markForCheck();
      },
      error: () => this.toast.error('Failed to load reviews')
    });
  }

  private loadStats(): void {
    this.svc.getStats().subscribe({
      next: s => { this.stats = s; this.cdr.markForCheck(); },
      error: () => {}
    });
  }

  private loadTopRated(): void {
    this.svc.getTopRated().subscribe({
      next: t => { this.topRated = t; this.cdr.markForCheck(); },
      error: () => {}
    });
  }

  applyFilter(): void {
    if (this.tab === 'all')      this.filtered = this.reviews;
    else if (this.tab === 'pending')  this.filtered = this.reviews.filter(r => r.status === 'PENDING');
    else if (this.tab === 'approved') this.filtered = this.reviews.filter(r => r.status === 'APPROVED');
    this.page = 0;
    this.cdr.markForCheck();
  }

  goToPage(nextPage: number): void {
    this.page = Math.max(0, Math.min(nextPage, this.totalPages - 1));
    this.cdr.markForCheck();
  }

  approve(r: Review): void {
    this.svc.approveReview(r.id).subscribe({
      next: updated => { this.updateLocal(updated); this.toast.success('Review approved'); },
      error: () => this.toast.error('Failed')
    });
  }

  reject(r: Review): void {
    this.svc.rejectReview(r.id).subscribe({
      next: updated => { this.updateLocal(updated); this.toast.success('Review rejected'); },
      error: () => this.toast.error('Failed')
    });
  }

  deleteReview(r: Review): void {
    if (!confirm('Delete this review permanently?')) return;
    this.svc.deleteReview(r.id).subscribe({
      next: () => {
        this.reviews = this.reviews.filter(x => x.id !== r.id);
        this.applyFilter();
        this.loadStats();
        this.toast.success('Deleted');
      },
      error: () => this.toast.error('Failed')
    });
  }

  toggleReply(r: Review): void {
    this.replyTargetId = this.replyTargetId === r.id ? null : r.id;
    this.replyText = r.adminReply ?? '';
    this.cdr.markForCheck();
  }

  submitReply(r: Review): void {
    if (!this.replyText.trim()) return;
    this.svc.addReply(r.id, this.replyText.trim()).subscribe({
      next: updated => {
        this.updateLocal(updated);
        this.replyTargetId = null;
        this.replyText = '';
        this.toast.success('Reply saved');
      },
      error: () => this.toast.error('Failed')
    });
  }

  starsDisplay(rating: number): string {
    const r = Math.round(rating);
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  }

  statusIcon(status: string): string {
    if (status === 'APPROVED') return 'verified';
    if (status === 'REJECTED') return 'block';
    return 'hourglass_top';
  }

  initials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }

  private updateLocal(updated: Review): void {
    const idx = this.reviews.findIndex(x => x.id === updated.id);
    if (idx !== -1) this.reviews[idx] = updated;
    this.applyFilter();
    this.loadStats();
    this.cdr.markForCheck();
  }
}
