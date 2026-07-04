import { Injectable, signal, computed } from '@angular/core';
import { CartItem, Product } from '../models/models';

@Injectable({ providedIn: 'root' })
export class CartService {
  private _items = signal<CartItem[]>([]);

  readonly items = this._items.asReadonly();
  readonly total = computed(() =>
    this._items().reduce((s, i) => s + i.product.price * i.quantity, 0));
  readonly count = computed(() =>
    this._items().reduce((s, i) => s + i.quantity, 0));

  addToCart(product: Product, colorName?: string, size?: string): void {
    this._items.update(items => {
      const idx = items.findIndex(i =>
        i.product.id === product.id &&
        i.selectedColor === colorName &&
        i.selectedSize === size
      );
      if (idx > -1) {
        const updated = [...items];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        return updated;
      }
      return [...items, { product, quantity: 1, selectedColor: colorName, selectedSize: size }];
    });
  }

  updateQty(productId: number, qty: number): void {
    if (qty < 1) { this.remove(productId); return; }
    this._items.update(items =>
      items.map(i => i.product.id === productId ? { ...i, quantity: qty } : i));
  }

  remove(productId: number): void {
    this._items.update(items => items.filter(i => i.product.id !== productId));
  }

  clear(): void {
    this._items.set([]);
  }
}
