import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatListModule,
    MatIconModule, MatButtonModule, MatDividerModule, MatTooltipModule
  ],
  template: `
    <mat-sidenav-container class="admin-container">

      <!-- Sidebar -->
      <mat-sidenav mode="side" opened class="admin-sidenav">
        <!-- Brand -->
        <div class="sidenav-brand">
          <mat-icon class="brand-icon">storefront</mat-icon>
          <div>
            <div class="brand-name">Beauty Textile</div>
            <div class="brand-sub">{{ isAdmin ? 'Admin Panel' : 'Billing User' }}</div>
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Nav items — BILLING users only see Billing/POS -->
        <mat-nav-list class="nav-list">
          @if (isAdmin) {
            <a mat-list-item routerLink="/admin/dashboard" routerLinkActive="nav-active">
              <mat-icon matListItemIcon>dashboard</mat-icon>
              <span matListItemTitle>Dashboard</span>
            </a>
            <a mat-list-item routerLink="/admin/products" routerLinkActive="nav-active">
              <mat-icon matListItemIcon>inventory_2</mat-icon>
              <span matListItemTitle>Products</span>
            </a>
          }
          <a mat-list-item routerLink="/admin/billing" routerLinkActive="nav-active">
            <mat-icon matListItemIcon>receipt_long</mat-icon>
            <span matListItemTitle>Billing / POS</span>
          </a>
          @if (isAdmin) {
            <a mat-list-item routerLink="/admin/orders" routerLinkActive="nav-active">
              <mat-icon matListItemIcon>local_shipping</mat-icon>
              <span matListItemTitle>Orders</span>
            </a>
            <a mat-list-item routerLink="/admin/reports" routerLinkActive="nav-active">
              <mat-icon matListItemIcon>bar_chart</mat-icon>
              <span matListItemTitle>Reports</span>
            </a>
            <a mat-list-item routerLink="/admin/discounts" routerLinkActive="nav-active">
              <mat-icon matListItemIcon>local_offer</mat-icon>
              <span matListItemTitle>Discounts</span>
            </a>
            <a mat-list-item routerLink="/admin/returns" routerLinkActive="nav-active">
              <mat-icon matListItemIcon>assignment_return</mat-icon>
              <span matListItemTitle>Returns</span>
            </a>
            <a mat-list-item routerLink="/admin/inventory" routerLinkActive="nav-active">
              <mat-icon matListItemIcon>warehouse</mat-icon>
              <span matListItemTitle>Inventory</span>
            </a>
            <a mat-list-item routerLink="/admin/reviews" routerLinkActive="nav-active">
              <mat-icon matListItemIcon>rate_review</mat-icon>
              <span matListItemTitle>Reviews</span>
            </a>
            <a mat-list-item routerLink="/admin/settings" routerLinkActive="nav-active">
              <mat-icon matListItemIcon>settings</mat-icon>
              <span matListItemTitle>Settings</span>
            </a>
          }
        </mat-nav-list>

        <div class="sidenav-footer">
          <mat-divider></mat-divider>
          <button class="logout-item" (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>Logout</span>
          </button>
        </div>
      </mat-sidenav>

      <!-- Main content -->
      <mat-sidenav-content class="admin-content">
        <!-- Top bar -->
        <mat-toolbar class="admin-topbar">
          <span class="topbar-title">{{ isAdmin ? 'Admin Panel' : 'Billing — POS' }}</span>
          <span class="spacer"></span>
          <button mat-icon-button (click)="logout()" matTooltip="Logout">
            <mat-icon>logout</mat-icon>
          </button>
        </mat-toolbar>
        <div class="content-wrap">
          <router-outlet />
        </div>
      </mat-sidenav-content>

    </mat-sidenav-container>
  `,
  styles: [`
    :host { display: block; height: 100vh; }
    .admin-container { height: 100vh; }
    .admin-sidenav {
      width: 240px;
      background: #2c1a00;
      color: white;
      border-right: none !important;
    }
    .sidenav-brand {
      display: flex; align-items: center; gap: 12px;
      padding: 20px 16px;
    }
    .brand-icon { font-size: 28px !important; width: 28px; height: 28px; color: #ffb347; }
    .brand-name { font-size: .95rem; font-weight: 700; color: white; }
    .brand-sub { font-size: .72rem; color: rgba(255,255,255,.5); }
    .nav-list { padding-top: 8px !important; }
    .nav-list a { color: #fff !important; border-radius: 8px !important; margin: 2px 8px !important; }
    .nav-list a:hover { background: rgba(255,255,255,.12) !important; color: #fff !important; }
    .nav-list a.nav-active { background: #805500 !important; color: #fff !important; }
    .nav-list mat-icon { color: rgba(255,255,255,.85) !important; }
    .nav-list a.nav-active mat-icon { color: #fff !important; }
    /* Force Material override for all text inside sidenav */
    .admin-sidenav .mdc-list-item__primary-text { color: #fff !important; }
    .admin-sidenav .mat-mdc-list-item-title { color: #fff !important; }
    .sidenav-footer { padding: 8px; }
    .logout-item {
      width: 100%;
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px; border-radius: 8px;
      background: transparent; border: none;
      color: rgba(255,255,255,.75); font-size: .9rem; font-family: inherit;
      cursor: pointer; transition: background .2s;
    }
    .logout-item mat-icon { color: rgba(255,255,255,.75); font-size: 20px; width: 20px; height: 20px; }
    .logout-item:hover { background: rgba(255,255,255,.1); color: #fff; }
    .logout-item:hover mat-icon { color: #fff; }
    .admin-topbar {
      background: white !important;
      color: #ffffff !important;
      box-shadow: 0 1px 4px rgba(0,0,0,.08);
      position: sticky; top: 0; z-index: 10;
    }
    .topbar-title { font-weight: 600; color: #805500; }
    .spacer { flex: 1; }
    .admin-content { background: #f8f4ef; }
    .content-wrap { padding: 28px; }
    @media (max-width: 768px) {
      .admin-sidenav { width: 200px; }
      .content-wrap { padding: 16px; }
    }
  `]
})
export class AdminLayoutComponent {
  get isAdmin(): boolean { return this.auth.isAdmin(); }
  constructor(private auth: AuthService, private router: Router) {}
  logout(): void { this.auth.logout(); this.router.navigate(['/admin/login']); }
}

