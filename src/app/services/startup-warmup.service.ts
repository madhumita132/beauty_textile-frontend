import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StartupWarmupService {
  private readonly apiOrigin = environment.apiUrl.replace(/\/api\/?$/, '');

  warmupBackend(): void {
    const candidates = this.buildCandidateUrls();
    void this.tryWarmup(candidates);
  }

  private buildCandidateUrls(): string[] {
    const urls = [
      `${this.apiOrigin}/health`,
      `${this.apiOrigin}/actuator/health`,
      `${environment.apiUrl}/categories`
    ];

    return Array.from(new Set(urls.filter(Boolean)));
  }

  private async tryWarmup(urls: string[]): Promise<void> {
    for (const url of urls) {
      const ok = await this.ping(url, 7000);
      if (ok) return;
    }
  }

  private async ping(url: string, timeoutMs: number): Promise<boolean> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        credentials: 'omit',
        signal: controller.signal
      });

      // Any real backend response indicates the service is reachable.
      return response.ok || response.status === 401 || response.status === 403;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }
}
