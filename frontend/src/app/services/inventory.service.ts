import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  BulkStatusRequest, ImportResult, InventoryProductRequest, InventorySummary,
  PagedResponse, Product, StockAdjustment, StockAdjustRequest
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class InventoryService {

  private base = '/api/inventory';

  constructor(private http: HttpClient) {}

  // ── Products (paginated) ─────────────────────────────────────────────────

  listProducts(page = 0, size = 50, sort = 'name', dir = 'asc'): Observable<PagedResponse<Product>> {
    const params = new HttpParams()
      .set('page', page).set('size', size).set('sort', sort).set('dir', dir);
    return this.http.get<PagedResponse<Product>>(`${this.base}/products`, { params });
  }

  searchProducts(q: string, page = 0, size = 50): Observable<PagedResponse<Product>> {
    const params = new HttpParams().set('q', q).set('page', page).set('size', size);
    return this.http.get<PagedResponse<Product>>(`${this.base}/products/search`, { params });
  }

  listByCategory(category: string, page = 0, size = 50): Observable<PagedResponse<Product>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PagedResponse<Product>>(
      `${this.base}/products/category/${encodeURIComponent(category)}`, { params });
  }

  listLowStock(page = 0, size = 50): Observable<PagedResponse<Product>> {
    return this.http.get<PagedResponse<Product>>(
      `${this.base}/products/low-stock?page=${page}&size=${size}`);
  }

  listOutOfStock(page = 0, size = 50): Observable<PagedResponse<Product>> {
    return this.http.get<PagedResponse<Product>>(
      `${this.base}/products/out-of-stock?page=${page}&size=${size}`);
  }

  createProduct(req: InventoryProductRequest): Observable<Product> {
    return this.http.post<Product>(`${this.base}/products`, req);
  }

  updateProduct(id: number, req: InventoryProductRequest): Observable<Product> {
    return this.http.put<Product>(`${this.base}/products/${id}`, req);
  }

  // ── Stock Adjustment ─────────────────────────────────────────────────────

  adjustStock(req: StockAdjustRequest): Observable<StockAdjustment> {
    return this.http.post<StockAdjustment>(`${this.base}/stock/adjust`, req);
  }

  getStockHistory(productId: number): Observable<StockAdjustment[]> {
    return this.http.get<StockAdjustment[]>(`${this.base}/stock/history/${productId}`);
  }

  getStockHistoryRange(from: string, to: string): Observable<StockAdjustment[]> {
    return this.http.get<StockAdjustment[]>(
      `${this.base}/stock/history/range?from=${from}&to=${to}`);
  }

  // ── Barcodes ─────────────────────────────────────────────────────────────

  generateMissingBarcodes(): Observable<{ updatedCount: number }> {
    return this.http.post<{ updatedCount: number }>(`${this.base}/barcodes/generate-missing`, {});
  }

  getBarcodeImageUrl(value: string, width = 300, height = 80): string {
    return `${this.base}/barcodes/image/${encodeURIComponent(value)}?width=${width}&height=${height}`;
  }

  exportBarcodesExcelUrl(ids?: number[]): string {
    if (ids && ids.length) {
      return `${this.base}/barcodes/export?ids=${ids.join('&ids=')}`;
    }
    return `${this.base}/barcodes/export`;
  }

  // ── Excel Import ─────────────────────────────────────────────────────────

  getImportTemplateUrl(): string { return `${this.base}/import/template`; }

  importExcel(file: File, importedBy = 'admin'): Observable<ImportResult> {
    const form = new FormData();
    form.append('file', file);
    form.append('importedBy', importedBy);
    return this.http.post<ImportResult>(`${this.base}/import`, form);
  }

  // ── Bulk operations ───────────────────────────────────────────────────────

  bulkUpdateStatus(req: BulkStatusRequest): Observable<{ updatedCount: number }> {
    return this.http.post<{ updatedCount: number }>(`${this.base}/products/bulk-status`, req);
  }

  // ── Reports ───────────────────────────────────────────────────────────────

  getSummary(): Observable<InventorySummary> {
    return this.http.get<InventorySummary>(`${this.base}/reports/summary`);
  }
}
