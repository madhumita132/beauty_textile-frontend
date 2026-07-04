import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AdminUser } from '../models/models';

interface AuthResponse {
  username: string;
  role: string;
}

interface UserSession {
  username: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser$ = new BehaviorSubject<UserSession | null>(null);
  private loggedIn$ = new BehaviorSubject<boolean>(false);

  readonly isLoggedIn$ = this.loggedIn$.asObservable();
  readonly currentUser = this.currentUser$.asObservable();

  constructor(private http: HttpClient) {
    // Check if user has an active session on app load
    this.checkSession().subscribe();
  }

  /** Validate current session with backend **/
  checkSession(): Observable<UserSession | null> {
    return this.http.get<UserSession>(`${environment.apiUrl}/auth/me`, { withCredentials: true }).pipe(
      tap(user => {
        this.currentUser$.next(user);
        this.loggedIn$.next(true);
      }),
      catchError(() => {
        this.currentUser$.next(null);
        this.loggedIn$.next(false);
        return of(null);
      })
    );
  }

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${environment.apiUrl}/auth/login`,
      { username, password },
      { withCredentials: true }
    ).pipe(
      tap(res => {
        this.currentUser$.next({ username: res.username, role: res.role });
        this.loggedIn$.next(true);
      })
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(
      `${environment.apiUrl}/auth/logout`,
      {},
      { withCredentials: true }
    ).pipe(
      tap(() => {
        this.currentUser$.next(null);
        this.loggedIn$.next(false);
      }),
      catchError(() => {
        this.currentUser$.next(null);
        this.loggedIn$.next(false);
        return of(void 0);
      })
    );
  }

  getUsername(): string { return this.currentUser$.value?.username || ''; }
  getRole(): string { return this.currentUser$.value?.role || 'ADMIN'; }
  isLoggedIn(): boolean { return this.loggedIn$.value; }
  isAdmin(): boolean { return this.getRole() === 'ADMIN'; }
  isBilling(): boolean { return this.getRole() === 'BILLING'; }

  // ── User management (admin only) ──────────────────────────────────────────

  listUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${environment.apiUrl}/auth/users`, { withCredentials: true });
  }

  createUser(username: string, password: string, role: string): Observable<AdminUser> {
    return this.http.post<AdminUser>(
      `${environment.apiUrl}/auth/users`,
      { username, password, role },
      { withCredentials: true }
    );
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/auth/users/${id}`, { withCredentials: true });
  }

  changePassword(id: number, password: string): Observable<any> {
    return this.http.put(
      `${environment.apiUrl}/auth/users/${id}/password`,
      { password },
      { withCredentials: true }
    );
  }
}
