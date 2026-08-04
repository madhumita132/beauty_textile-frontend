import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Billing, BillingRequest } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private base = `${environment.apiUrl}/billing`;

  constructor(private http: HttpClient) {}

  create(req: BillingRequest): Observable<Billing> {
    return this.http.post<Billing>(this.base, req);
  }

  getAll(): Observable<Billing[]> {
    return this.http.get<Billing[]>(this.base);
  }

  getById(id: number): Observable<Billing> {
    return this.http.get<Billing>(`${this.base}/${id}`);
  }

  /** Search past bills by any combination of customer name, phone and exact date (yyyy-MM-dd). */
  search(params: { name?: string; phone?: string; date?: string }): Observable<Billing[]> {
    let httpParams: Record<string, string> = {};
    if (params.name)  httpParams['name']  = params.name;
    if (params.phone) httpParams['phone'] = params.phone;
    if (params.date)  httpParams['date']  = params.date;
    return this.http.get<Billing[]>(`${this.base}/search`, { params: httpParams });
  }

  /** Edit a previously-saved bill (items, customer info, discount) after billing. */
  update(id: number, req: BillingRequest): Observable<Billing> {
    return this.http.put<Billing>(`${this.base}/${id}`, req);
  }
}
