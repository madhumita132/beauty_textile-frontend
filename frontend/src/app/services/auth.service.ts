import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AdminUser } from '../models/models';

interface AuthResponse {
  token: string;
  username: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private TOKEN_KEY = 'bt_admin_token';
  private ROLE_KEY  = 'bt_admin_role';
  private loggedIn$ = new BehaviorSubject<boolean>(this.hasToken());

  readonly isLoggedIn$ = this.loggedIn$.asObservable();

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { username, password }).pipe(
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        localStorage.setItem(this.ROLE_KEY,  res.role);
        this.loggedIn$.next(true);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    this.loggedIn$.next(false);
  }

  getToken(): string | null { return localStorage.getItem(this.TOKEN_KEY); }
  hasToken(): boolean { return !!localStorage.getItem(this.TOKEN_KEY); }
  getRole(): string { return localStorage.getItem(this.ROLE_KEY) || 'ADMIN'; }
  isAdmin(): boolean { return this.getRole() === 'ADMIN'; }
  isBilling(): boolean { return this.getRole() === 'BILLING'; }

  // ── User management (admin only) ──────────────────────────────────────────

  listUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${environment.apiUrl}/auth/users`);
  }

  createUser(username: string, password: string, role: string): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${environment.apiUrl}/auth/users`, { username, password, role });
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/auth/users/${id}`);
  }

  changePassword(id: number, password: string): Observable<any> {
    return this.http.put(`${environment.apiUrl}/auth/users/${id}/password`, { password });
  }
}
