import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';
import { Category } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private base = `${environment.apiUrl}/categories`;

  private _all$: Observable<Category[]> | null = null;
  private _tree$: Observable<Category[]> | null = null;
  private _activeTree$: Observable<Category[]> | null = null;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Category[]> {
    if (!this._all$) {
      this._all$ = this.http.get<Category[]>(this.base).pipe(shareReplay(1));
    }
    return this._all$;
  }

  getTree(): Observable<Category[]> {
    if (!this._tree$) {
      this._tree$ = this.http.get<Category[]>(`${this.base}/tree`).pipe(shareReplay(1));
    }
    return this._tree$;
  }

  /** Customer-facing tree — only categories/subcategories the admin has marked active. */
  getActiveTree(): Observable<Category[]> {
    if (!this._activeTree$) {
      this._activeTree$ = this.http.get<Category[]>(`${this.base}/tree`, { params: { activeOnly: 'true' } }).pipe(shareReplay(1));
    }
    return this._activeTree$;
  }

  clearCache(): void { this._all$ = null; this._tree$ = null; this._activeTree$ = null; }

  create(name: string, parentId?: number | null): Observable<Category> {
    return this.http.post<Category>(this.base, { name, parentId: parentId ?? null })
      .pipe(tap(() => this.clearCache()));
  }

  delete(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`)
      .pipe(tap(() => this.clearCache()));
  }

  setActive(id: number, active: boolean): Observable<Category> {
    return this.http.patch<Category>(`${this.base}/${id}/active`, { active })
      .pipe(tap(() => this.clearCache()));
  }

  uploadImage(id: number, file: File): Observable<{ imagePath: string }> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<{ imagePath: string }>(`${this.base}/${id}/image`, fd)
      .pipe(tap(() => this.clearCache()));
  }
}
