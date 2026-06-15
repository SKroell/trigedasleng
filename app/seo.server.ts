/* Shared server-side SEO helpers (sitemap + robots). */

/**
 * Canonical site origin. Prefers SITE_URL (set this in production!), else falls
 * back to the request's forwarded origin.
 */
export function resolveOrigin(request: Request): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, "");
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || url.host;
  return `${proto}://${host}`;
}
