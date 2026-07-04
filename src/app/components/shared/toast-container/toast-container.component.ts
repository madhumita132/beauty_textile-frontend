import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ToastService } from '../../../services/toast.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
  template: `
    <div class="toast-container">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [ngClass]="'toast-' + t.type">
          {{ t.message }}
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  constructor(public toast: ToastService) {}
}
