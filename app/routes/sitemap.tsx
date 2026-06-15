/*
 * Resource route: /sitemap.xml
 *
 * Generated on demand from the database so it always reflects the current
 * dictionary. Includes the public content pages plus every distinct word page
 * and every translation page. Excludes auth/admin/api/search/offline routes.
 *
 * Submit https://<your-domain>/sitemap.xml in Google Search Console.
 * Set the SITE_URL env var in production to pin the canonical origin;
 * otherwise the request's (forwarded) origin is used.
 */
import slugify from "slugify";
import { prisma } from "../db.server";
import { resolveOrigin } from "../seo.server";

const STATIC_PATHS = [
  "/",
  "/dictionary",
  "/dictionary/canon",
  "/dictionary/slakgedasleng",
  "/dictionary/noncanon",
  "/translations",
  "/grammar",
  "/learn",
  "/sources",
  "/community",
];

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function loader({ request }: { request: Request }) {
  const origin = resolveOrigin(request);

  const words = await prisma.word.findMany({
    where: { dictionary: { value: { not: "English" } } },
    select: { value: true, updatedAt: true },
  });

  // One URL per distinct word value (homonyms share a page); keep newest date.
  const wordMap = new Map<string, Date>();
  for (const w of words) {
    if (!w.value || /[\s/]/.test(w.value)) continue; // skip unsafe/empty values
    const prev = wordMap.get(w.value);
    if (!prev || w.updatedAt > prev) wordMap.set(w.value, w.updatedAt);
  }

  const sentences = await prisma.sentence.findMany({
    select: { id: true, value: true, updatedAt: true },
  });

  const entries: { loc: string; lastmod?: string }[] = [];
  for (const p of STATIC_PATHS) entries.push({ loc: origin + p });
  for (const [value, updatedAt] of wordMap) {
    entries.push({ loc: `${origin}/word/${encodeURIComponent(value)}`, lastmod: updatedAt.toISOString() });
  }
  for (const s of sentences) {
    const slug = slugify(s.value, { lower: true, strict: true });
    entries.push({ loc: `${origin}/translation/${s.id}/${slug}`, lastmod: s.updatedAt.toISOString() });
  }

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries
      .map(
        (e) =>
          `  <url><loc>${xmlEscape(e.loc)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ""}</url>`,
      )
      .join("\n") +
    `\n</urlset>\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
