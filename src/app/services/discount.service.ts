import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CategoryDiscountRequest, Offer, OfferRequest, ProductDiscountRequest } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DiscountService {
  private offersBase    = `${environment.apiUrl}/offers`;
  private discountBase  = `${environment.apiUrl}/admin/discounts`;

  constructor(private http: HttpClient) {}

  // ── Offers ─────────────────────────────────────────────────────────────

  getAllOffers(): Observable<Offer[]> {
    return this.http.get<Offer[]>(this.offersBase);
  }

  getActiveOffers(): Observable<Offer[]> {
    return this.http.get<Offer[]>(`${this.offersBase}/active`);
  }

  createOffer(req: OfferRequest): Observable<Offer> {
    return this.http.post<Offer>(this.offersBase, req);
  }

  updateOffer(id: number, req: OfferRequest): Observable<Offer> {
    return this.http.put<Offer>(`${this.offersBase}/${id}`, req);
  }

  toggleOffer(id: number): Observable<unknown> {
    return this.http.patch(`${this.offersBase}/${id}/toggle`, {});
  }

  deleteOffer(id: number): Observable<unknown> {
    return this.http.delete(`${this.offersBase}/${id}`);
  }

  // ── Product / Category discounts ────────────────────────────────────────

  applyProductDiscount(req: ProductDiscountRequest): Observable<unknown> {
    return this.http.post(`${this.discountBase}/products`, req);
  }

  applyCategoryDiscount(req: CategoryDiscountRequest): Observable<unknown> {
    return this.http.post(`${this.discountBase}/category`, req);
  }
}
