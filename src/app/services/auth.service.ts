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
  private readonly apiBase = this.resolveApiBase();

  readonly isLoggedIn$ = this.loggedIn$.asObservable();
  readonly currentUser = this.currentUser$.asObservable();

  constructor(private http: HttpClient) {
    // Check if user has an active session on app load
    this.checkSession().subscribe();
    this.startSilentSessionKeepAlive();
  }

  /**
   * Silently resets the server-side session's sliding idle timeout while the user
   * is actually working, so an active shift never gets logged out mid-task.
   *
   * Deliberately NOT a blind setInterval ping: it only fires on real user activity
   * (click/keydown/mousemove/touchstart/scroll), at most once per PING_MIN_INTERVAL_MS,
   * and only while the tab is visible and a session is currently logged in. A tab left
   * open with no interaction still expires after the backend's idle timeout — this is
   * the intended security boundary, not an infinite session.
   */
  private lastKeepAliveAt = 0;
  private readonly KEEP_ALIVE_MIN_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly ACTIVITY_EVENTS = ['click', 'keydown', 'mousemove', 'touchstart', 'scroll'];

  private startSilentSessionKeepAlive(): void {
    if (typeof window === 'undefined') return;
    const onActivity = () => this.pingSessionIfDue();
    this.ACTIVITY_EVENTS.forEach(evt => window.addEventListener(evt, onActivity, { passive: true }));
  }

  private pingSessionIfDue(): void {
    if (!this.loggedIn$.value) return;
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
    const now = Date.now();
    if (now - this.lastKeepAliveAt < this.KEEP_ALIVE_MIN_INTERVAL_MS) return;
    this.lastKeepAliveAt = now;
    // Fire-and-forget: touching /auth/me resets the session's idle timer. A failure
    // here means the session already expired server-side; the next real API call
    // will 401 and the route guards will redirect to login as usual.
    this.http.get<UserSession>(`${this.apiBase}/auth/me`, { withCredentials: true }).pipe(
      catchError(() => of(null))
    ).subscribe();
  }

  /** Validate current session with backend **/
  checkSession(): Observable<UserSession | null> {
    return this.http.get<UserSession>(`${this.apiBase}/auth/me`, { withCredentials: true }).pipe(
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
      `${this.apiBase}/auth/login`,
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
      `${this.apiBase}/auth/logout`,
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
    return this.http.get<AdminUser[]>(`${this.apiBase}/auth/users`, { withCredentials: true });
  }

  createUser(username: string, password: string, role: string): Observable<AdminUser> {
    return this.http.post<AdminUser>(
      `${this.apiBase}/auth/users`,
      { username, password, role },
      { withCredentials: true }
    );
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/auth/users/${id}`, { withCredentials: true });
  }

  changePassword(id: number, password: string): Observable<any> {
    return this.http.put(
      `${this.apiBase}/auth/users/${id}/password`,
      { password },
      { withCredentials: true }
    );
  }

  private resolveApiBase(): string {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return 'http://localhost:8080/api';
    }
    return environment.apiUrl;
  }
}
