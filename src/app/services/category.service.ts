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

  clearCache(): void { this._all$ = null; this._tree$ = null; }

  create(name: string, parentId?: number | null): Observable<Category> {
    return this.http.post<Category>(this.base, { name, parentId: parentId ?? null })
      .pipe(tap(() => this.clearCache()));
  }

  delete(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`)
      .pipe(tap(() => this.clearCache()));
  }
}
