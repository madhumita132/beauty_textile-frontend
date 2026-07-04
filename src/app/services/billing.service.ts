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
}
