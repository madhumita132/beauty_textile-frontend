import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../../services/cart.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-navbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule, MatBadgeModule, MatTooltipModule],
  template: `
    <mat-toolbar class="bt-toolbar no-print">
      <!-- Brand -->
      <a routerLink="/" class="brand-link">
        <mat-icon class="brand-icon">storefront</mat-icon>
        <span class="brand-name">Beauty Textile</span>
      </a>

      <span class="spacer"></span>

      <!-- Nav links -->
      <nav class="nav-links">
        <a mat-button routerLink="/" routerLinkActive="nav-active" [routerLinkActiveOptions]="{exact:true}">
          <mat-icon>home</mat-icon> Home
        </a>
        <a mat-button routerLink="/products" routerLinkActive="nav-active">
          <mat-icon>grid_view</mat-icon> Shop
        </a>
      </nav>

      <!-- Cart -->
      <a mat-icon-button routerLink="/cart" matTooltip="Cart"
         [matBadge]="cart.count() > 0 ? cart.count() : null"
         matBadgeColor="warn" matBadgeSize="small" class="cart-btn">
        <mat-icon>shopping_cart</mat-icon>
      </a>

      <!-- Admin -->
      <a mat-stroked-button routerLink="/admin/login" class="admin-btn" matTooltip="Admin Login">
        <mat-icon>admin_panel_settings</mat-icon>
        Admin
      </a>
    </mat-toolbar>
  `,
  styles: [`
    .bt-toolbar {
      background: #805500 !important;
      color: white !important;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 8px rgba(128,85,0,.35) !important;
      gap: 4px;
    }
    .brand-link {
      display: flex; align-items: center; gap: 8px;
      font-size: 1.15rem; font-weight: 700; color: white;
      text-decoration: none; letter-spacing: .5px;
    }
    .brand-icon { font-size: 22px !important; }
    .brand-name { display: none; }
    @media (min-width: 480px) { .brand-name { display: inline; } }
    .spacer { flex: 1; }
    .nav-links { display: flex; gap: 2px; }
    .nav-links a { color: rgba(255,255,255,.85) !important; font-size: .88rem; }
    .nav-links a:hover, .nav-links .nav-active { color: white !important; background: rgba(255,255,255,.15) !important; }
    .cart-btn { color: white !important; }
    .admin-btn {
      color: white !important;
      border-color: rgba(255,255,255,.5) !important;
      font-size: .82rem !important;
      height: 36px;
      margin-left: 8px;
    }
    .admin-btn:hover { background: rgba(255,255,255,.15) !important; border-color: white !important; }
    @media (max-width: 600px) { .nav-links { display: none; } }
  `]
})
export class NavbarComponent {
  constructor(public cart: CartService) {}
}

