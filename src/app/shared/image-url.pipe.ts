import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../environments/environment';

/** Backend origin (apiUrl minus the trailing /api), e.g. https://beauty-textile-backend.onrender.com */
const API_ORIGIN = environment.apiUrl.replace(/\/api\/?$/, '');

/**
 * Resolves a backend-relative image path (e.g. "/images/xxx.jpg") into an absolute URL
 * pointing at the API host. Needed because the frontend and backend are often deployed
 * on different origins (e.g. Cloudflare Pages / Firebase Hosting vs. Render), so a
 * bare "/images/..." path resolves against the *frontend's* origin and 404s.
 *
 * Absolute URLs (http/https/data) and frontend-bundled asset paths (which never start
 * with "/images/") are passed through untouched.
 */
export function resolveImageUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (/^(https?:)?\/\//i.test(path) || path.startsWith('data:')) return path;
  if (path.startsWith('/images/')) return `${API_ORIGIN}${path}`;
  return path;
}

@Pipe({ name: 'imageUrl', standalone: true })
export class ImageUrlPipe implements PipeTransform {
  transform(path: string | null | undefined): string {
    return resolveImageUrl(path);
  }
}
