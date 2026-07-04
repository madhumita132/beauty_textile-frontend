import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Billing, ExchangeRecord, ExchangeRequest, ReturnExchangeMonthlyStats,
  ReturnRecord, ReturnRequest
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class ReturnExchangeService {

  private base = '/api/returns';

  constructor(private http: HttpClient) {}

  // ── Bill search ───────────────────────────────────────────────────────────

  getBillById(id: number): Observable<Billing> {
    return this.http.get<Billing>(`${this.base}/search/bill/${id}`);
  }

  getBillsByPhone(phone: string): Observable<Billing[]> {
    return this.http.get<Billing[]>(`${this.base}/search/phone/${encodeURIComponent(phone)}`);
  }

  getBillsByDate(date: string): Observable<Billing[]> {
    return this.http.get<Billing[]>(`${this.base}/search/date?date=${date}`);
  }

  // ── Returns ───────────────────────────────────────────────────────────────

  processReturn(req: ReturnRequest): Observable<ReturnRecord> {
    return this.http.post<ReturnRecord>(`${this.base}/return`, req);
  }

  getReturnsByBill(billId: number): Observable<ReturnRecord[]> {
    return this.http.get<ReturnRecord[]>(`${this.base}/return/bill/${billId}`);
  }

  getAllReturns(): Observable<ReturnRecord[]> {
    return this.http.get<ReturnRecord[]>(`${this.base}/return/all`);
  }

  // ── Exchanges ─────────────────────────────────────────────────────────────

  processExchange(req: ExchangeRequest): Observable<ExchangeRecord> {
    return this.http.post<ExchangeRecord>(`${this.base}/exchange`, req);
  }

  getExchangesByBill(billId: number): Observable<ExchangeRecord[]> {
    return this.http.get<ExchangeRecord[]>(`${this.base}/exchange/bill/${billId}`);
  }

  getAllExchanges(): Observable<ExchangeRecord[]> {
    return this.http.get<ExchangeRecord[]>(`${this.base}/exchange/all`);
  }

  // ── Reports ───────────────────────────────────────────────────────────────

  getMonthlyStats(month: string): Observable<ReturnExchangeMonthlyStats> {
    return this.http.get<ReturnExchangeMonthlyStats>(`${this.base}/stats/monthly/${month}`);
  }
}
