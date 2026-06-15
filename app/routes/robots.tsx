/*
 * Resource route: /robots.txt
 *
 * Allows crawling of content, keeps crawlers off auth/admin/api/search/offline,
 * and points them at the sitemap. The Sitemap URL uses the canonical origin
 * (SITE_URL in production, else the request's forwarded origin).
 */
import { resolveOrigin } from "../seo.server";

export async function loader({ request }: { request: Request }) {
  const origin = resolveOrigin(request);
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin/",
    "Disallow: /api/",
    "Disallow: /search",
    "Disallow: /login",
    "Disallow: /signup",
    "Disallow: /offline",
    "",
    `Sitemap: ${origin}/sitemap.xml`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
