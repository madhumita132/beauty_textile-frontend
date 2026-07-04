import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="login-page">
      <!-- Background pattern -->
      <div class="login-bg"></div>

      <mat-card class="login-card mat-elevation-z8">
        <!-- Brand header -->
        <div class="login-brand">
          <div class="brand-icon-wrap">
            <mat-icon class="brand-icon">storefront</mat-icon>
          </div>
          <h1 class="brand-name">Beauty Textile</h1>
          <p class="brand-sub">Admin Portal</p>
        </div>

        <mat-card-content>
          @if (error) {
            <div class="error-banner">
              <mat-icon style="font-size:18px;width:18px;height:18px;">error_outline</mat-icon>
              {{ error }}
            </div>
          }

          <form (ngSubmit)="submit()" #loginForm="ngForm">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Username</mat-label>
              <mat-icon matPrefix>person</mat-icon>
              <input matInput [(ngModel)]="username" name="username"
                     autocomplete="username" required placeholder="admin" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <mat-icon matPrefix>lock</mat-icon>
              <input matInput [(ngModel)]="password" name="password"
                     [type]="showPass ? 'text' : 'password'"
                     autocomplete="current-password" required />
              <button mat-icon-button matSuffix type="button" (click)="showPass = !showPass">
                <mat-icon>{{ showPass ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>

            <button mat-raised-button color="primary" type="submit"
                    class="login-btn" [disabled]="loading">
              @if (loading) {
                <mat-spinner diameter="20" style="display:inline-block;margin-right:8px;"></mat-spinner>
              }
              {{ loading ? 'Signing in...' : 'Sign In' }}
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #3e2000 0%, #805500 50%, #b87a00 100%);
      padding: 24px;
      position: relative;
      overflow: hidden;
    }
    .login-bg {
      position: absolute; inset: 0;
      background-image: repeating-linear-gradient(
        45deg, rgba(255,255,255,.03) 0px, rgba(255,255,255,.03) 2px,
        transparent 2px, transparent 12px
      );
    }
    .login-card {
      width: 100%; max-width: 420px;
      border-radius: 16px !important;
      padding: 8px;
      position: relative; z-index: 1;
    }
    .login-brand {
      text-align: center;
      padding: 32px 24px 16px;
    }
    .brand-icon-wrap {
      width: 72px; height: 72px; border-radius: 50%;
      background: linear-gradient(135deg, #805500, #b87a00);
      display: inline-flex; align-items: center; justify-content: center;
      margin-bottom: 16px;
      box-shadow: 0 4px 20px rgba(128,85,0,.4);
    }
    .brand-icon { font-size: 36px !important; width: 36px !important; height: 36px !important; color: white; }
    .brand-name { font-size: 1.6rem; font-weight: 700; color: #3e2000; margin: 0 0 4px; }
    .brand-sub { font-size: .9rem; color: #8a7560; margin: 0; }
    .error-banner {
      background: #fdecea; color: #d13737;
      padding: 10px 14px; border-radius: 8px;
      font-size: .85rem; margin-bottom: 16px;
      display: flex; align-items: center; gap: 8px;
    }
    .full-width { width: 100%; margin-bottom: 8px; }
    .login-btn {
      width: 100%; height: 48px; font-size: 1rem;
      margin-top: 8px; border-radius: 8px !important;
      display: flex; align-items: center; justify-content: center;
      background: #805500 !important; color: white !important;
    }
    mat-card-content { padding: 0 24px 24px; }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  loading = false;
  error = '';
  showPass = false;

  constructor(private auth: AuthService, private router: Router, private toast: ToastService, private cdr: ChangeDetectorRef) {}

  submit(): void {
    if (!this.username || !this.password) { this.error = 'Enter username and password'; return; }
    this.loading = true;
    this.error = '';
    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        const dest = this.auth.isAdmin() ? '/admin/dashboard' : '/admin/billing';
        this.router.navigate([dest]);
      },
      error: () => { this.loading = false; this.error = 'Invalid credentials. Please try again.'; this.cdr.markForCheck(); }
    });
  }
}

