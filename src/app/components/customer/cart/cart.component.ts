import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../services/cart.service';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NavbarComponent, DecimalPipe],
  template: `
    <app-navbar />
    <div class="container" style="padding: 32px 16px 48px;">
      <h1 class="page-title">Your Cart</h1>
      @if (cart.count() === 0) {
        <div class="empty-cart">
          <p>Your cart is empty.</p>
          <a routerLink="/products" class="btn btn-primary mt-16">Continue Shopping</a>
        </div>
      } @else {
        <div class="cart-layout">
          <div class="cart-items">
            @for (item of cart.items(); track item.product.id) {
              <div class="cart-row">
                <img [src]="item.product.imageUrl || 'assets/placeholder.jpg'" [alt]="item.product.name" class="cart-img" />
                <div class="cart-details">
                  <div class="cart-name">{{ item.product.name }}</div>
                  <div class="cart-category text-muted text-sm">{{ item.product.category }}</div>
                  <div class="cart-price">₹{{ item.product.price | number:'1.0-0' }}</div>
                </div>
                <div class="qty-controls">
                  <button class="qty-btn" (click)="cart.updateQty(item.product.id, item.quantity - 1)">−</button>
                  <span class="qty-val">{{ item.quantity }}</span>
                  <button class="qty-btn" (click)="cart.updateQty(item.product.id, item.quantity + 1)">+</button>
                </div>
                <div class="cart-line-total">₹{{ (item.product.price * item.quantity) | number:'1.0-0' }}</div>
                <button class="remove-btn" (click)="cart.remove(item.product.id)">✕</button>
              </div>
            }
          </div>
          <div class="cart-summary card">
            <h2>Order Summary</h2>
            <div class="summary-row">
              <span>Subtotal ({{ cart.count() }} items)</span>
              <span>₹{{ cart.total() | number:'1.0-0' }}</span>
            </div>
            <div class="summary-row summary-total">
              <span>Total</span>
              <span>₹{{ cart.total() | number:'1.0-0' }}</span>
            </div>
            <a routerLink="/checkout" class="btn btn-primary btn-block mt-16">Proceed to Checkout</a>
            <a routerLink="/products" class="btn btn-outline btn-block mt-8">Continue Shopping</a>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-title { font-size: 1.6rem; font-weight: 700; margin-bottom: 24px; }
    .empty-cart { text-align: center; padding: 60px; color: #7f8c8d; font-size: 1.1rem; }
    .cart-layout { display: flex; gap: 32px; align-items: flex-start; flex-wrap: wrap; }
    .cart-items { flex: 1; min-width: 0; }
    .cart-row { display: flex; align-items: center; gap: 16px; padding: 16px 0; border-bottom: 1px solid #ecf0f1; }
    .cart-img { width: 80px; height: 100px; object-fit: cover; border-radius: 6px; flex-shrink: 0; }
    .cart-details { flex: 1; }
    .cart-name { font-weight: 600; }
    .cart-price { color: #c0392b; font-weight: 600; margin-top: 4px; }
    .qty-controls { display: flex; align-items: center; gap: 8px; }
    .qty-btn { width: 30px; height: 30px; border-radius: 50%; background: #ecf0f1; font-size: 1rem; display: flex; align-items: center; justify-content: center; }
    .qty-val { font-weight: 600; min-width: 24px; text-align: center; }
    .cart-line-total { font-weight: 700; min-width: 80px; text-align: right; }
    .remove-btn { color: #e74c3c; font-size: .9rem; background: none; padding: 4px; }
    .cart-summary { padding: 24px; width: 300px; flex-shrink: 0; }
    .cart-summary h2 { font-size: 1.1rem; font-weight: 700; margin-bottom: 20px; }
    .summary-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: .9rem; }
    .summary-total { font-size: 1.05rem; font-weight: 700; border-top: 1px solid #ecf0f1; padding-top: 12px; }
    @media (max-width: 600px) { .cart-summary { width: 100%; } }
  `]
})
export class CartComponent {
  constructor(public cart: CartService) {}
}
