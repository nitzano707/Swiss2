/* Service worker — עובד אופליין.
   כשמעדכנים תוכן (למשל trip.json), כדאי להעלות מספר גרסה כדי שהמכשירים יתעדכנו. */
const CACHE_VERSION = "v4";
const CACHE_NAME = `swiss-trip-${CACHE_VERSION}`;

const CORE_ASSETS = [
  "index.html",
  "days.html",
  "day.html",
  "hotels.html",
  "parking.html",
  "info.html",
  "weather.html",
  "currency.html",
  "manifest.json",
  "css/style.css",
  "js/icons.js",
  "js/common.js",
  "js/app.js",
  "js/days.js",
  "js/day.js",
  "js/hotels.js",
  "js/parking.js",
  "js/info.js",
  "js/weather.js",
  "js/currency.js",
  "data/trip.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Live weather / currency APIs: always go to the network, never cache.
  // (weather.js / currency.js already do their own localStorage caching for offline use.)
  if (req.url.includes("api.open-meteo.com") || req.url.includes("api.frankfurter.app")){
    event.respondWith(fetch(req).catch(() => new Response(null, { status: 503 })));
    return;
  }

  // Trip data: try network first so edits show up, fall back to cache offline.
  if (req.url.endsWith("data/trip.json")){
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Everything else (app pages/scripts + hotlinked Wikimedia Commons photos):
  // cache-first, then network, updating the cache as we go. Cross-origin image
  // requests come back as opaque responses (status 0) — still cacheable and
  // worth storing so photos keep working offline after the first view.
  event.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req).then(res => {
        if (res && (res.status === 200 || res.type === "opaque")){
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
