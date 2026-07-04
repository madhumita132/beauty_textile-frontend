// Production — Spring Boot serves Angular on the same server.
// Use relative /api so it works on any domain (local, Cloudflare tunnel, custom domain).
export const environment = {
  production: true,
  apiUrl: '/api'
};
