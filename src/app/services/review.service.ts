import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Review, ReviewSummary, ReviewStats, ReviewRequest } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private base = `${environment.apiUrl}/reviews`;

  constructor(private http: HttpClient) {}

  // ── Customer ──────────────────────────────────────────────────────────────

  submitReview(req: ReviewRequest): Observable<Review> {
    return this.http.post<Review>(this.base, req);
  }

  getProductReviews(productId: number, star?: number): Observable<Review[]> {
    let params = new HttpParams();
    if (star) params = params.set('star', star);
    return this.http.get<Review[]>(`${this.base}/product/${productId}`, { params });
  }

  getProductSummary(productId: number): Observable<ReviewSummary> {
    return this.http.get<ReviewSummary>(`${this.base}/product/${productId}/summary`);
  }

  getTestimonials(limit = 6): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.base}/testimonials?limit=${limit}`);
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  getAllReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.base}/admin/all`);
  }

  getStats(): Observable<ReviewStats> {
    return this.http.get<ReviewStats>(`${this.base}/admin/stats`);
  }

  getTopRated(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/admin/top-rated`);
  }

  approveReview(id: number): Observable<Review> {
    return this.http.put<Review>(`${this.base}/admin/${id}/approve`, {});
  }

  rejectReview(id: number): Observable<Review> {
    return this.http.put<Review>(`${this.base}/admin/${id}/reject`, {});
  }

  addReply(id: number, reply: string): Observable<Review> {
    return this.http.put<Review>(`${this.base}/admin/${id}/reply`, { action: 'REPLY', reply });
  }

  deleteReview(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/${id}`);
  }
}
