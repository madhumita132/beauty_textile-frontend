import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Auth Interceptor: Enables cookie-based session authentication.
 * Cookies are automatically sent/received with withCredentials: true
 * on individual requests. This interceptor ensures all requests
 * support CORS cookie credentials.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Clone request with credentials enabled for session cookies
  req = req.clone({ withCredentials: true });
  return next(req);
};
