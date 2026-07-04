import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardSummary, MonthlyReport, ProductSales, CategorySales, DailySales } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private base = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  dashboard(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.base}/dashboard`);
  }

  monthly(month: string): Observable<MonthlyReport> {
    return this.http.get<MonthlyReport>(`${this.base}/monthly`, { params: { month } });
  }

  daily(date: string): Observable<DailySales> {
    return this.http.get<DailySales>(`${this.base}/daily`, { params: { date } });
  }

  productWise(from?: string, to?: string): Observable<ProductSales[]> {
    let params: Record<string, string> = {};
    if (from) params['from'] = from;
    if (to)   params['to']   = to;
    return this.http.get<ProductSales[]>(`${this.base}/product-wise`, { params });
  }

  categoryWise(from?: string, to?: string): Observable<CategorySales[]> {
    let params: Record<string, string> = {};
    if (from) params['from'] = from;
    if (to)   params['to']   = to;
    return this.http.get<CategorySales[]>(`${this.base}/category-wise`, { params });
  }
}
