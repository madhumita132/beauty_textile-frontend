import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';
import { HeroSlide } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HeroSlideService {
  private base = `${environment.apiUrl}/hero-slides`;

  private _all$: Observable<HeroSlide[]> | null = null;

  constructor(private http: HttpClient) {}

  getAll(): Observable<HeroSlide[]> {
    if (!this._all$) {
      this._all$ = this.http.get<HeroSlide[]>(this.base).pipe(shareReplay(1));
    }
    return this._all$;
  }

  clearCache(): void { this._all$ = null; }

  create(kicker: string, title: string, text: string): Observable<HeroSlide> {
    return this.http.post<HeroSlide>(this.base, { kicker, title, text })
      .pipe(tap(() => this.clearCache()));
  }

  update(id: number, kicker: string, title: string, text: string): Observable<HeroSlide> {
    return this.http.put<HeroSlide>(`${this.base}/${id}`, { kicker, title, text })
      .pipe(tap(() => this.clearCache()));
  }

  delete(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`)
      .pipe(tap(() => this.clearCache()));
  }

  uploadImage(id: number, file: File): Observable<{ imagePath: string }> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<{ imagePath: string }>(`${this.base}/${id}/image`, fd)
      .pipe(tap(() => this.clearCache()));
  }
}
