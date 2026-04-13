const CACHE_NAME = 'saferoute-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.jsx',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  // Cache-first for static/font assets; network-first for API calls
  const url = new URL(e.request.url);
  const isAPI = url.hostname.includes('mapbox') || url.hostname.includes('openweathermap') || url.hostname.includes('overpass');

  if (isAPI) {
    // Network-first: return cached backup on failure
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Cache-first for app assets
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
  }
});
