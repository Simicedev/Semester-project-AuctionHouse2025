
const CACHE_VERSION = "v4"; // increment to invalidate old caches
const CACHE_NAME = `pwa-shell-${CACHE_VERSION}`;
// Keep shell minimal; do not pre-cache index so we always get the latest HTML
const APP_SHELL = ["/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isDevRequest(url) {
  return (
    url.pathname.startsWith("/@vite") ||
    url.pathname.startsWith("/@id/") ||
    url.pathname.startsWith("/src/")
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin GET requests
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  // Skip dev/HMR like paths (mostly relevant locally)
  if (isDevRequest(url)) return;

  // Network-first for navigations to always get the freshest index.html
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const networkResp = await fetch(req);
          // Optionally: update a copy of index.html in cache for offline usage
          const cache = await caches.open(CACHE_NAME);
          cache.put("/index.html", networkResp.clone());
          cache.put("/", networkResp.clone());
          return networkResp;
        } catch (err) {
          // Offline fallback: previously cached index (if any)
          const cache = await caches.open(CACHE_NAME);
          return (
            (await cache.match("/index.html")) ||
            new Response("Offline", { status: 503, statusText: "Offline" })
          );
        }
      })()
    );
    return;
  }

  // Cache-first for other same-origin GET assets (CSS, JS, images)
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const resp = await fetch(req);
        // Only cache successful, basic (opaque is often cross-origin) responses
        if (resp.status === 200 && resp.type === "basic") {
          cache.put(req, resp.clone());
        }
        return resp;
      } catch (err) {
        return new Response(null, {
          status: 504,
          statusText: "Gateway Timeout"
        });
      }
    })()
  );
});
