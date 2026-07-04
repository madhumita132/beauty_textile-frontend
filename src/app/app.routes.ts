import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  // ---- Customer routes ----
  {
    path: '',
    loadComponent: () => import('./components/customer/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'products',
    loadComponent: () => import('./components/customer/product-list/product-list.component').then(m => m.ProductListComponent)
  },
  {
    path: 'products/:id',
    loadComponent: () => import('./components/customer/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
  },
  {
    path: 'cart',
    loadComponent: () => import('./components/customer/cart/cart.component').then(m => m.CartComponent)
  },
  {
    path: 'checkout',
    loadComponent: () => import('./components/customer/checkout/checkout.component').then(m => m.CheckoutComponent)
  },
  {
    path: 'order-confirmation/:id',
    loadComponent: () => import('./components/customer/order-confirmation/order-confirmation.component').then(m => m.OrderConfirmationComponent)
  },
  // ---- Admin routes ----
  {
    path: 'admin/login',
    loadComponent: () => import('./components/admin/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./components/admin/layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'billing', pathMatch: 'full' },   // overridden by login redirect
      {
        path: 'dashboard',
        canActivate: [adminGuard],
        loadComponent: () => import('./components/admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'products',
        canActivate: [adminGuard],
        loadComponent: () => import('./components/admin/product-management/product-management.component').then(m => m.ProductManagementComponent)
      },
      {
        path: 'billing',
        loadComponent: () => import('./components/admin/billing/billing.component').then(m => m.BillingComponent)
      },
      {
        path: 'orders',
        canActivate: [adminGuard],
        loadComponent: () => import('./components/admin/orders/orders.component').then(m => m.OrdersComponent)
      },
      {
        path: 'reports',
        canActivate: [adminGuard],
        loadComponent: () => import('./components/admin/reports/reports.component').then(m => m.ReportsComponent)
      },
      {
        path: 'discounts',
        canActivate: [adminGuard],
        loadComponent: () => import('./components/admin/discounts/discounts.component').then(m => m.DiscountsComponent)
      },
      {
        path: 'returns',
        canActivate: [adminGuard],
        loadComponent: () => import('./components/admin/return-exchange/return-exchange.component').then(m => m.ReturnExchangeComponent)
      },
      {
        path: 'inventory',
        canActivate: [adminGuard],
        loadComponent: () => import('./components/admin/inventory/inventory.component').then(m => m.InventoryComponent)
      },
      {
        path: 'reviews',
        canActivate: [adminGuard],
        loadComponent: () => import('./components/admin/reviews/admin-reviews.component').then(m => m.AdminReviewsComponent)
      },
      {
        path: 'settings',
        canActivate: [adminGuard],
        loadComponent: () => import('./components/admin/settings/gst-settings.component').then(m => m.GstSettingsComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];

