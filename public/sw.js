/*
 * Trigedasleng PWA service worker (hand-rolled).
 *
 * Strategy summary:
 *   - /audio/*          -> network only, NEVER cached (the audio library is large).
 *   - /assets, /fonts,
 *     /img + icons      -> cache-first (hashed build assets are immutable).
 *   - Google Fonts      -> stale-while-revalidate.
 *   - navigations (HTML)-> network-first; offline + cached -> serve it; offline +
 *                          uncached -> redirect to the /offline shell, which
 *                          client-navigates to the target and renders it from
 *                          the precached dataset.
 *   - other GETs (incl.
 *     React Router .data
 *     and /offline-data.json) -> network-first with cache fallback.
 *
 * Full offline: /offline-data.json (the whole dictionary) and the /offline shell
 * are precached on install, so records the user never opened still work offline.
 *
 * Bump VERSION on deploy to drop stale runtime/navigation caches.
 */
const VERSION = "v2";
const STATIC_CACHE = `static-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;
const FONT_CACHE = `fonts-${VERSION}`;
const CURRENT_CACHES = [STATIC_CACHE, RUNTIME_CACHE, FONT_CACHE];

// Required app shell — install fails if any of these can't be cached.
const APP_SHELL = [
  "/offline.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/img/pwa512x512.png",
  "/img/ios180x180.png",
];

// Best-effort precache for full offline (large / may occasionally fail).
const OFFLINE_EXTRAS = ["/offline", "/offline-data.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll(APP_SHELL);
      await Promise.allSettled(OFFLINE_EXTRAS.map((url) => cache.add(url)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !CURRENT_CACHES.includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // Audio: never cached — always go to the network, fail naturally offline.
  if (sameOrigin && url.pathname.startsWith("/audio/")) return;

  // Google Fonts (CSS + font files): stale-while-revalidate.
  if (
    url.origin === "https://fonts.googleapis.com" ||
    url.origin === "https://fonts.gstatic.com"
  ) {
    event.respondWith(staleWhileRevalidate(request, FONT_CACHE));
    return;
  }

  if (!sameOrigin) return;

  // Immutable static assets: cache-first.
  if (
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.startsWith("/img/")
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Page navigations: network-first with offline-shell fallback.
  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Everything else (incl. React Router *.data and /offline-data.json).
  event.respondWith(networkFirst(request, RUNTIME_CACHE));
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    return cached || Response.error();
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    // Fall back to ANY cache (the precached dataset may live in the static cache).
    const cached = (await cache.match(request)) || (await caches.match(request));
    return cached || Response.error();
  }
}

async function handleNavigation(request) {
  const url = new URL(request.url);
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    // A page we've already visited (cached document).
    const cached = await caches.match(request, {
      ignoreSearch: url.pathname === "/offline",
    });
    if (cached) return cached;

    // Unvisited deep link offline → boot the precached /offline shell, which
    // client-navigates to the target and renders it from the dataset.
    if (url.pathname !== "/offline") {
      const loc = new URL("/offline", self.location.origin);
      loc.searchParams.set("to", url.pathname + url.search);
      return Response.redirect(loc.toString(), 302);
    }

    const shell = await caches.match("/offline", { ignoreSearch: true });
    return shell || (await caches.match("/offline.html")) || Response.error();
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && (response.ok || response.type === "opaque")) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);
  return cached || network;
}
