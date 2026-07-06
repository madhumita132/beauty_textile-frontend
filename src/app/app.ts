import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './components/shared/toast-container/toast-container.component';
import { StartupWarmupService } from './services/startup-warmup.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent],
  template: `<router-outlet /><app-toast-container />`,
  styles: []
})
export class App {
  constructor(private warmup: StartupWarmupService) {
    this.warmup.warmupBackend();
  }
}
