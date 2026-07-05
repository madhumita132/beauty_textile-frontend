import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../../services/cart.service';
import { AuthService } from '../../../services/auth.service';
import { CategoryService } from '../../../services/category.service';
import { Category } from '../../../models/models';
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
    <div class="top-ticker no-print">
      <div class="ticker-track">
        <span>New collection arrivals</span>
        <span>Worldwide shipping available</span>
        <span>Fresh launches every week</span>
        <span>Trusted by customers since 2008</span>
      </div>
    </div>

    <mat-toolbar class="bt-toolbar no-print">
      <a mat-icon-button routerLink="/admin/login" class="left-admin-btn" matTooltip="Admin Login">
        <mat-icon>admin_panel_settings</mat-icon>
      </a>

      <a routerLink="/" class="brand-link">
        <span class="brand-name">Beauty Textile</span>
      </a>

      <span class="spacer"></span>

      <!-- Nav links -->
      <nav class="nav-links">
        <a mat-button routerLink="/" routerLinkActive="nav-active" [routerLinkActiveOptions]="{exact:true}">
          <mat-icon>home</mat-icon> Home
        </a>
        <a mat-button routerLink="/products" routerLinkActive="nav-active" [routerLinkActiveOptions]="{exact:true}">
          <mat-icon>grid_view</mat-icon> Shop
        </a>
        @for (cat of categories; track cat.id) {
          <div class="nav-cat-item">
            <a mat-button class="nav-cat-link" [routerLink]="['/products']" [queryParams]="{ group: cat.name }">
              {{ cat.name }}
              @if (cat.children && cat.children.length > 0) {
                <mat-icon class="caret">expand_more</mat-icon>
              }
            </a>
            @if (cat.children && cat.children.length > 0) {
              <div class="nav-dropdown">
                @for (sub of cat.children; track sub.id) {
                  <div class="nav-dropdown-item-wrap">
                    <a class="nav-dropdown-item" [routerLink]="['/products']" [queryParams]="{ group: cat.name, category: sub.name }">
                      {{ sub.name }}
                      @if (sub.children && sub.children.length > 0) {
                        <mat-icon class="caret-right">chevron_right</mat-icon>
                      }
                    </a>
                    @if (sub.children && sub.children.length > 0) {
                      <div class="nav-flyout">
                        @for (leaf of sub.children; track leaf.id) {
                          <a class="nav-dropdown-item" [routerLink]="['/products']" [queryParams]="{ group: cat.name, category: leaf.name }">
                            {{ leaf.name }}
                          </a>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }
      </nav>

      <!-- Cart -->
      <a mat-icon-button routerLink="/cart" matTooltip="Cart"
         [matBadge]="cart.count() > 0 ? cart.count() : null"
         matBadgeColor="warn" matBadgeSize="small" class="cart-btn">
        <mat-icon>shopping_cart</mat-icon>
      </a>

      <a mat-icon-button [href]="instagramLink" target="_blank" matTooltip="Instagram" class="social-btn insta-btn">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <defs>
            <linearGradient id="igGradNav" x1="0" y1="24" x2="24" y2="0">
              <stop offset="0" stop-color="#f9ce34"/>
              <stop offset=".5" stop-color="#ee2a7b"/>
              <stop offset="1" stop-color="#6228d7"/>
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="24" height="24" rx="6" fill="url(#igGradNav)"/>
          <path fill="#fff" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.012-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      </a>
      <a mat-icon-button [href]="whatsappLink" target="_blank" matTooltip="WhatsApp" class="social-btn whatsapp-btn">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <circle cx="12" cy="12" r="11" fill="#25D366"/>
          <path fill="#fff" d="M12 5.5a6.5 6.5 0 00-5.6 9.8L5.5 18.5l3.3-.9a6.5 6.5 0 100-12.1zm3.9 9.3c-.2.5-1 1-1.4 1-.4 0-.8.1-2.6-.6-2.2-.9-3.6-3.1-3.7-3.2-.1-.2-.9-1.2-.9-2.2 0-1 .5-1.5.7-1.7.2-.2.4-.2.6-.2h.4c.1 0 .3 0 .5.4l.6 1.5c.1.2.1.3 0 .5l-.3.4c-.1.1-.2.2-.1.4.2.4.7 1.1 1.5 1.7.9.7 1.6.9 1.8 1 .2.1.3.1.4-.1l.5-.6c.2-.2.3-.2.5-.1l1.4.7c.2.1.3.1.3.3 0 .2 0 .6-.2 1.1z"/>
        </svg>
      </a>

      @if (auth.isLoggedIn()) {
        <button mat-icon-button (click)="logout()" matTooltip="Logout" class="logout-btn">
          <mat-icon>logout</mat-icon>
        </button>
      }
    </mat-toolbar>
  `,
  styles: [`
    .top-ticker {
      overflow: hidden;
      background: #0f0f0f;
      color: #fff;
      font-size: .8rem;
      font-weight: 700;
      white-space: nowrap;
      padding: 7px 0;
    }
    .ticker-track {
      display: inline-flex;
      gap: 34px;
      padding-left: 100%;
      animation: tickerMove 20s linear infinite;
    }
    .ticker-track span::before { content: '• '; opacity: .75; }
    @keyframes tickerMove { from { transform: translateX(0); } to { transform: translateX(-100%); } }

    .bt-toolbar {
      background: #8a5a00 !important;
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
    .brand-name { display: inline; }
    .spacer { flex: 1; }
    .nav-links {
      display: flex; align-items: center; gap: 2px;
      overflow-x: auto; overflow-y: hidden;
      scrollbar-width: none; -ms-overflow-style: none;
      min-width: 0;
    }
    .nav-links::-webkit-scrollbar { display: none; }
    .nav-links > a { flex-shrink: 0; }
    .nav-links > a { color: rgba(255,255,255,.85) !important; font-size: .88rem; }
    .nav-links > a:hover, .nav-links > .nav-active { color: white !important; background: rgba(255,255,255,.15) !important; }

    /* Category mega-menu */
    .nav-cat-item { position: relative; display: flex; align-items: center; flex-shrink: 0; }
    .nav-cat-link { color: rgba(255,255,255,.85) !important; font-size: .88rem; display: flex; align-items: center; }
    .nav-cat-link:hover { color: white !important; background: rgba(255,255,255,.15) !important; }
    .caret { font-size: 18px !important; width: 18px; height: 18px; margin-left: -2px; }
    .caret-right { font-size: 16px !important; width: 16px; height: 16px; margin-left: auto; color: #b08a4a; }
    .nav-dropdown {
      display: none;
      position: absolute; top: 100%; left: 0;
      background: #fff; color: #3a2a10;
      min-width: 220px; border-radius: 0 0 10px 10px;
      box-shadow: 0 10px 24px rgba(0,0,0,.18);
      z-index: 200; padding: 6px 0;
    }
    .nav-cat-item:hover .nav-dropdown { display: block; }
    .nav-dropdown-item-wrap { position: relative; }
    .nav-dropdown .nav-dropdown-item,
    .nav-flyout .nav-dropdown-item {
      display: flex; align-items: center; gap: 6px;
      padding: 9px 18px; font-size: .86rem; color: #3a2a10 !important;
      text-decoration: none; white-space: nowrap;
    }
    .nav-dropdown .nav-dropdown-item:hover,
    .nav-flyout .nav-dropdown-item:hover { background: #fff3dc; color: #805500 !important; }
    .nav-flyout {
      display: none;
      position: absolute; top: 0; left: 100%;
      background: #fff; color: #3a2a10;
      min-width: 200px; border-radius: 10px;
      box-shadow: 0 10px 24px rgba(0,0,0,.18);
      z-index: 210; padding: 6px 0;
    }
    .nav-dropdown-item-wrap:hover .nav-flyout { display: block; }

    .cart-btn { color: white !important; flex-shrink: 0; }
    .left-admin-btn { color: #fff !important; margin-right: 8px; flex-shrink: 0; }
    .social-btn { color: #fff !important; flex-shrink: 0; }
    .social-btn svg { display: block; }
    .logout-btn { color: #fff !important; flex-shrink: 0; }
    @media (max-width: 600px) { .nav-links { display: none; } }
  `]
})
export class NavbarComponent implements OnInit {
  instagramLink = 'https://www.instagram.com/_beauty_sarees_?igsh=dm9neGJkOHllaTR0';
  whatsappLink = 'https://wa.me/918344515186?text=Hello%20Beauty%20Textile';
  categories: Category[] = [];

  constructor(
    public cart: CartService,
    public auth: AuthService,
    private catSvc: CategoryService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.catSvc.getActiveTree().subscribe(c => {
      this.categories = c;
      this.cdr.markForCheck();
    });
  }

  logout(): void {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/'));
  }
}

