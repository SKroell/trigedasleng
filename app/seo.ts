/*
 * Isomorphic SEO helpers used by route `meta()` functions (run on both server
 * and client). Builds title/description, canonical, Open Graph + Twitter tags,
 * optional JSON-LD, and a noindex flag.
 *
 * The canonical origin comes from the root loader's `siteUrl` (see seo.server.ts
 * + root.tsx), read out of the route `matches`.
 */
import type { MetaDescriptor } from "react-router";

export const SITE_NAME = "Trigedasleng Dictionary";
export const SITE_TAGLINE =
  "The unofficial dictionary, grammar and translations for Trigedasleng — the language of the Grounders in The 100.";
const DEFAULT_IMAGE_PATH = "/img/pwa512x512.png";

/** Pull the canonical origin out of the root route's loader data. */
export function originFromMatches(matches: any[]): string {
  const root = matches?.find((m) => m?.id === "root");
  return (root?.data?.siteUrl as string) || "";
}

interface PageMetaOpts {
  title?: string; // page-specific; SITE_NAME is appended. Omit for the site name alone.
  description?: string;
  origin?: string;
  path?: string; // pathname → canonical + og:url (omit to skip canonical)
  image?: string; // absolute image URL (defaults to the PWA icon)
  noindex?: boolean;
  jsonLd?: object | object[];
}

export function pageMeta(opts: PageMetaOpts): MetaDescriptor[] {
  const { title, description, origin, path, noindex } = opts;
  const fullTitle = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
  const desc = description || SITE_TAGLINE;
  const url = origin && path != null ? origin + path : undefined;
  const image = opts.image || (origin ? origin + DEFAULT_IMAGE_PATH : undefined);

  const tags: MetaDescriptor[] = [
    { title: fullTitle },
    { name: "description", content: desc },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: desc },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: SITE_NAME },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: desc },
  ];
  if (url) {
    tags.push({ property: "og:url", content: url });
    tags.push({ tagName: "link", rel: "canonical", href: url });
  }
  if (image) {
    tags.push({ property: "og:image", content: image });
    tags.push({ name: "twitter:image", content: image });
  }
  if (noindex) tags.push({ name: "robots", content: "noindex, follow" });

  const jsonLd = opts.jsonLd ? (Array.isArray(opts.jsonLd) ? opts.jsonLd : [opts.jsonLd]) : [];
  for (const item of jsonLd) tags.push({ "script:ld+json": item } as MetaDescriptor);

  return tags;
}

/** Clamp a description to a sensible length for search snippets. */
export function clampDescription(text: string, max = 160): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : t.slice(0, max - 1).trimEnd() + "…";
}
