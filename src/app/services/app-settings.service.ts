import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppSettings } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AppSettingsService {
  private base = `${environment.apiUrl}/settings`;

  constructor(private http: HttpClient) {}

  getGstSettings(): Observable<AppSettings> {
    return this.http.get<AppSettings>(`${this.base}/gst`);
  }

  updateGstSettings(settings: { gstEnabled: boolean; gstPercentage: number }): Observable<AppSettings> {
    return this.http.put<AppSettings>(`${this.base}/gst`, settings);
  }
}
