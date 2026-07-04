import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';
import { Product, ProductVariant } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private base = `${environment.apiUrl}/products`;

  // In-memory cache: key = "category|search", value = cached Observable
  private cache = new Map<string, Observable<Product[]>>();

  constructor(private http: HttpClient) {}

  getAll(category?: string, search?: string): Observable<Product[]> {
    const key = `${category ?? ''}|${search ?? ''}`;
    if (!this.cache.has(key)) {
      let params: Record<string, string> = {};
      if (category) params['category'] = category;
      if (search)   params['search']   = search;
      this.cache.set(key,
        this.http.get<Product[]>(this.base, { params }).pipe(shareReplay(1))
      );
    }
    return this.cache.get(key)!;
  }

  /** Call after create/update/delete to force fresh fetch */
  clearCache(): void { this.cache.clear(); }

  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.base}/${id}`);
  }

  getVariants(productId: number): Observable<ProductVariant[]> {
    return this.http.get<ProductVariant[]>(`${this.base}/${productId}/variants`);
  }

  addVariant(productId: number, variant: Partial<ProductVariant>): Observable<ProductVariant> {
    return this.http.post<ProductVariant>(`${this.base}/${productId}/variants`, variant);
  }

  updateVariant(productId: number, variantId: number, variant: Partial<ProductVariant>): Observable<ProductVariant> {
    return this.http.put<ProductVariant>(`${this.base}/${productId}/variants/${variantId}`, variant);
  }

  deleteVariant(productId: number, variantId: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${productId}/variants/${variantId}`);
  }

  getByBarcode(barcode: string): Observable<Product> {
    return this.http.get<Product>(`${this.base}/barcode/${barcode}`);
  }

  create(data: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(this.base, data).pipe(tap(() => this.clearCache()));
  }

  update(id: number, data: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.base}/${id}`, data).pipe(tap(() => this.clearCache()));
  }

  delete(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`).pipe(tap(() => this.clearCache()));
  }

  uploadImage(file: File): Observable<{ imageUrl: string }> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<{ imageUrl: string }>(`${this.base}/upload-image`, fd);
  }

  nextBarcode(): Observable<{ barcode: string }> {
    return this.http.get<{ barcode: string }>(`${this.base}/next-barcode`);
  }

  barcodeImageUrl(id: number): string {
    return `${this.base}/${id}/barcode.png`;
  }

  getLowStock(): Observable<Product[]> {
    return this.http.get<Product[]>(`${environment.apiUrl}/admin/low-stock`);
  }
}
